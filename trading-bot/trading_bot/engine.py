"""Orchestriert einen Analyse-/Handelszyklus: Daten laden → analysieren →
Risikoprüfung → (Paper-)Order ausführen → alles protokollieren.
"""
from __future__ import annotations

import json
import logging
import os
import time
from datetime import date

from .analysis.scorer import AnalysisResult, StockAnalyzer
from .broker.base import Broker
from .broker.paper_broker import PaperBroker
from .config import load_config
from .data_provider import DataProvider, DataProviderError
from .logging_utils import DecisionLogger, setup_logging
from .portfolio.paper_portfolio import (
    InsufficientFundsError,
    InsufficientSharesError,
    PaperPortfolio,
)
from .risk.risk_manager import RiskManager

logger = logging.getLogger(__name__)


class TradingBot:
    def __init__(self, config_path: str = "config.yaml"):
        self.config = load_config(config_path)

        state_cfg = self.config["state"]
        self.data_dir = state_cfg["data_dir"]
        self.log_dir = state_cfg["log_dir"]
        os.makedirs(self.data_dir, exist_ok=True)
        setup_logging(self.log_dir)
        self.decision_log = DecisionLogger(self.log_dir)

        analysis_cfg = self.config["analysis"]
        self.watchlist: list[str] = self.config["watchlist"]
        self.analyzer = StockAnalyzer(
            weights=analysis_cfg["weights"],
            buy_threshold=analysis_cfg["buy_score_threshold"],
            sell_threshold=analysis_cfg["sell_score_threshold"],
            min_confidence=analysis_cfg["min_confidence"],
        )
        self.lookback_days = analysis_cfg["lookback_days"]

        risk_cfg = self.config["risk"]
        self.risk_manager = RiskManager.from_config(risk_cfg)

        self.data_provider = DataProvider()

        portfolio_path = os.path.join(self.data_dir, "portfolio.json")
        self.portfolio = PaperPortfolio(
            starting_cash=risk_cfg["starting_cash"],
            fee_per_trade=risk_cfg["fee_per_trade"],
            state_path=portfolio_path,
        )
        self.broker: Broker = PaperBroker(self.portfolio)

        self._day_state_path = os.path.join(self.data_dir, "day_state.json")

    # -- Analyse ------------------------------------------------------------

    def _period_for_lookback(self) -> str:
        years = max(1, round(self.lookback_days / 252))
        return f"{years}y"

    def analyze_symbol(self, symbol: str) -> AnalysisResult:
        df = self.data_provider.get_history(symbol, period=self._period_for_lookback())
        fundamentals = self.data_provider.get_fundamentals(symbol)
        return self.analyzer.analyze(symbol, df, fundamentals)

    def analyze_watchlist(self) -> dict[str, AnalysisResult]:
        results = {}
        for symbol in self.watchlist:
            try:
                results[symbol] = self.analyze_symbol(symbol)
            except DataProviderError as exc:
                logger.warning("Überspringe %s: %s", symbol, exc)
        return results

    # -- Tagesverlust-Tracking ------------------------------------------------

    def _load_or_init_day_state(self, equity_now: float) -> float:
        today = date.today().isoformat()
        if os.path.exists(self._day_state_path):
            with open(self._day_state_path, encoding="utf-8") as f:
                state = json.load(f)
            if state.get("date") == today:
                return state["equity_start"]
        with open(self._day_state_path, "w", encoding="utf-8") as f:
            json.dump({"date": today, "equity_start": equity_now}, f)
        return equity_now

    # -- Handelszyklus ------------------------------------------------------

    def run_once(self) -> list[dict]:
        """Führt genau einen Analyse-/Handelszyklus über die Watchlist aus
        und gibt eine Liste der getroffenen Entscheidungen zurück."""
        decisions: list[dict] = []

        results = self.analyze_watchlist()
        last_prices = {symbol: r.metrics.get("price") for symbol, r in results.items() if r.metrics.get("price")}

        equity_now = self.broker.equity(last_prices)
        equity_start_of_day = self._load_or_init_day_state(equity_now)
        loss_guard_active = self.risk_manager.daily_loss_exceeded(equity_start_of_day, equity_now)
        if loss_guard_active:
            logger.warning(
                "Tagesverlust-Bremse aktiv (Start %.2f → jetzt %.2f) – keine neuen Käufe in diesem Zyklus.",
                equity_start_of_day,
                equity_now,
            )

        # 1) Bestehende Positionen zuerst auf Stop-Loss/Take-Profit prüfen.
        for symbol, pos in list(self.broker.get_positions().items()):
            price = last_prices.get(symbol)
            if price is None:
                continue
            entry = pos["avg_price"]
            action = None
            if self.risk_manager.hit_stop_loss(entry, price):
                action = "STOP_LOSS"
            elif self.risk_manager.hit_take_profit(entry, price):
                action = "TAKE_PROFIT"
            if action:
                trade = self.broker.execute(symbol, "SELL", pos["qty"], price, reason=action)
                decision = {
                    "symbol": symbol,
                    "action": action,
                    "qty": trade.qty,
                    "price": price,
                    "reason": f"{action}: Einstand {entry:.2f}, aktueller Kurs {price:.2f}",
                }
                decisions.append(decision)
                self.decision_log.log(**decision)
                logger.info("%s %s: %.4f Stück @ %.2f (%s)", action, symbol, trade.qty, price, decision["reason"])

        # 2) Neue Signale auswerten.
        for symbol, result in results.items():
            price = result.metrics.get("price")
            if price is None:
                continue
            holding = self.broker.get_positions().get(symbol)

            if result.signal == "BUY":
                if holding:
                    decision = {"symbol": symbol, "action": "HOLD", "reason": "Bereits investiert, kein Nachkauf."}
                elif loss_guard_active:
                    decision = {"symbol": symbol, "action": "SKIP", "reason": "Tagesverlust-Bremse aktiv."}
                elif not self.risk_manager.can_open_position(len(self.broker.get_positions())):
                    decision = {"symbol": symbol, "action": "SKIP", "reason": "Maximale Anzahl offener Positionen erreicht."}
                else:
                    equity = self.broker.equity(last_prices)
                    qty = self.risk_manager.position_size(equity, price)
                    if qty <= 0:
                        decision = {"symbol": symbol, "action": "SKIP", "reason": "Positionsgröße nach Risikoregeln = 0."}
                    else:
                        try:
                            reason = " | ".join(result.reasons)
                            trade = self.broker.execute(symbol, "BUY", qty, price, reason=reason)
                            decision = {
                                "symbol": symbol,
                                "action": "BUY",
                                "qty": trade.qty,
                                "price": price,
                                "score": result.score,
                                "confidence": result.confidence,
                                "reasons": result.reasons,
                            }
                            logger.info("KAUF %s: %d Stück @ %.2f (Score %.2f)", symbol, qty, price, result.score)
                        except InsufficientFundsError as exc:
                            decision = {"symbol": symbol, "action": "SKIP", "reason": str(exc)}
            elif result.signal == "SELL":
                if holding:
                    try:
                        reason = " | ".join(result.reasons)
                        trade = self.broker.execute(symbol, "SELL", holding["qty"], price, reason=reason)
                        decision = {
                            "symbol": symbol,
                            "action": "SELL",
                            "qty": trade.qty,
                            "price": price,
                            "score": result.score,
                            "confidence": result.confidence,
                            "reasons": result.reasons,
                        }
                        logger.info("VERKAUF %s: %.4f Stück @ %.2f (Score %.2f)", symbol, holding["qty"], price, result.score)
                    except InsufficientSharesError as exc:
                        decision = {"symbol": symbol, "action": "SKIP", "reason": str(exc)}
                else:
                    decision = {"symbol": symbol, "action": "HOLD", "reason": "Verkaufssignal, aber keine Position gehalten."}
            else:
                decision = {
                    "symbol": symbol,
                    "action": "HOLD",
                    "score": result.score,
                    "confidence": result.confidence,
                }

            decisions.append(decision)
            self.decision_log.log(**decision)

        return decisions

    def run(self, interval_minutes: float | None = None, iterations: int | None = None) -> None:
        """Führt run_once() einmalig oder wiederholt in einer Schleife aus.
        Ohne `interval_minutes` wird nur ein einzelner Zyklus ausgeführt."""
        count = 0
        while True:
            logger.info("=== Starte Handelszyklus %d ===", count + 1)
            self.run_once()
            count += 1
            if interval_minutes is None or (iterations is not None and count >= iterations):
                break
            time.sleep(interval_minutes * 60)

    def portfolio_summary(self) -> dict:
        results = self.analyze_watchlist()
        prices = {symbol: r.metrics.get("price") for symbol, r in results.items() if r.metrics.get("price")}
        # Für gehaltene Positionen außerhalb der Watchlist ggf. Live-Kurs nachladen.
        for symbol in self.broker.get_positions():
            if symbol not in prices:
                try:
                    prices[symbol] = self.data_provider.get_last_price(symbol)
                except DataProviderError:
                    pass
        return self.portfolio.summary(prices)
