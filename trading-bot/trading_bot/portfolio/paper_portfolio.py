"""Kostenloses Paper-/Test-Portfolio: simuliert Kauf/Verkauf mit virtuellem
Kapital, ohne dass echtes Geld oder ein echtes Broker-Konto involviert ist.
Das ist der Standard-Modus des Bots.
"""
from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone


class InsufficientFundsError(Exception):
    """Nicht genug virtuelles Kapital für einen Kauf."""


class InsufficientSharesError(Exception):
    """Nicht genug Stücke im Bestand für einen Verkauf."""


@dataclass
class Trade:
    timestamp: str
    symbol: str
    side: str  # "BUY" | "SELL"
    qty: float
    price: float
    fee: float
    reason: str = ""


class PaperPortfolio:
    def __init__(
        self,
        starting_cash: float = 10000.0,
        fee_per_trade: float = 1.0,
        state_path: str | None = None,
    ):
        self.starting_cash = starting_cash
        self.fee_per_trade = fee_per_trade
        self.state_path = state_path
        self.cash = starting_cash
        self.positions: dict[str, dict[str, float]] = {}  # symbol -> {qty, avg_price}
        self.trades: list[Trade] = []

        if state_path and os.path.exists(state_path):
            self.load(state_path)

    # -- Handel -----------------------------------------------------------

    def buy(self, symbol: str, qty: float, price: float, reason: str = "") -> Trade:
        if qty <= 0:
            raise ValueError("qty muss > 0 sein")
        cost = qty * price + self.fee_per_trade
        if cost > self.cash + 1e-9:
            raise InsufficientFundsError(
                f"Nicht genug virtuelles Kapital für {qty}x {symbol}: "
                f"benötigt {cost:.2f}, verfügbar {self.cash:.2f}"
            )
        self.cash -= cost
        pos = self.positions.get(symbol, {"qty": 0.0, "avg_price": 0.0})
        new_qty = pos["qty"] + qty
        pos["avg_price"] = (pos["qty"] * pos["avg_price"] + qty * price) / new_qty
        pos["qty"] = new_qty
        self.positions[symbol] = pos

        trade = Trade(
            timestamp=datetime.now(timezone.utc).isoformat(),
            symbol=symbol,
            side="BUY",
            qty=qty,
            price=price,
            fee=self.fee_per_trade,
            reason=reason,
        )
        self.trades.append(trade)
        self._autosave()
        return trade

    def sell(self, symbol: str, qty: float, price: float, reason: str = "") -> Trade:
        if qty <= 0:
            raise ValueError("qty muss > 0 sein")
        pos = self.positions.get(symbol)
        if not pos or pos["qty"] < qty - 1e-9:
            held = pos["qty"] if pos else 0.0
            raise InsufficientSharesError(
                f"Nicht genug Stücke von {symbol} zum Verkauf: gehalten {held}, angefragt {qty}"
            )
        proceeds = qty * price - self.fee_per_trade
        self.cash += proceeds
        pos["qty"] -= qty
        if pos["qty"] <= 1e-9:
            del self.positions[symbol]
        else:
            self.positions[symbol] = pos

        trade = Trade(
            timestamp=datetime.now(timezone.utc).isoformat(),
            symbol=symbol,
            side="SELL",
            qty=qty,
            price=price,
            fee=self.fee_per_trade,
            reason=reason,
        )
        self.trades.append(trade)
        self._autosave()
        return trade

    # -- Auswertung ---------------------------------------------------------

    def position_value(self, prices: dict[str, float]) -> float:
        value = 0.0
        for symbol, pos in self.positions.items():
            price = prices.get(symbol, pos["avg_price"])
            value += pos["qty"] * price
        return value

    def equity(self, prices: dict[str, float]) -> float:
        return self.cash + self.position_value(prices)

    def summary(self, prices: dict[str, float]) -> dict:
        positions = []
        for symbol, pos in sorted(self.positions.items()):
            price = prices.get(symbol, pos["avg_price"])
            market_value = pos["qty"] * price
            cost_basis = pos["qty"] * pos["avg_price"]
            unrealized_pnl = market_value - cost_basis
            unrealized_pnl_pct = (unrealized_pnl / cost_basis) if cost_basis else 0.0
            positions.append(
                {
                    "symbol": symbol,
                    "qty": pos["qty"],
                    "avg_price": pos["avg_price"],
                    "price": price,
                    "market_value": market_value,
                    "unrealized_pnl": unrealized_pnl,
                    "unrealized_pnl_pct": unrealized_pnl_pct,
                }
            )
        equity = self.equity(prices)
        return {
            "cash": self.cash,
            "equity": equity,
            "starting_cash": self.starting_cash,
            "total_pnl": equity - self.starting_cash,
            "total_pnl_pct": (equity - self.starting_cash) / self.starting_cash if self.starting_cash else 0.0,
            "positions": positions,
            "num_trades": len(self.trades),
        }

    # -- Persistenz -----------------------------------------------------------

    def _autosave(self) -> None:
        if self.state_path:
            self.save(self.state_path)

    def save(self, path: str) -> None:
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        data = {
            "starting_cash": self.starting_cash,
            "fee_per_trade": self.fee_per_trade,
            "cash": self.cash,
            "positions": self.positions,
            "trades": [asdict(t) for t in self.trades],
        }
        tmp_path = f"{path}.tmp"
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        os.replace(tmp_path, path)

    def load(self, path: str) -> None:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        self.starting_cash = data.get("starting_cash", self.starting_cash)
        self.fee_per_trade = data.get("fee_per_trade", self.fee_per_trade)
        self.cash = data.get("cash", self.starting_cash)
        self.positions = data.get("positions", {})
        self.trades = [Trade(**t) for t in data.get("trades", [])]

    def reset(self) -> None:
        self.cash = self.starting_cash
        self.positions = {}
        self.trades = []
        self._autosave()
