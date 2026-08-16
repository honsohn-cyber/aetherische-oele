"""Broker-Adapter für das kostenlose, simulierte Test-Portfolio. Standard-
und empfohlener Modus dieses Bots – kein echtes Geld involviert."""
from __future__ import annotations

from ..portfolio.paper_portfolio import PaperPortfolio, Trade
from .base import Broker


class PaperBroker(Broker):
    def __init__(self, portfolio: PaperPortfolio):
        self.portfolio = portfolio

    def get_cash(self) -> float:
        return self.portfolio.cash

    def get_positions(self) -> dict[str, dict[str, float]]:
        return self.portfolio.positions

    def equity(self, prices: dict[str, float]) -> float:
        return self.portfolio.equity(prices)

    def execute(self, symbol: str, side: str, qty: float, price: float, reason: str = "") -> Trade:
        if side == "BUY":
            return self.portfolio.buy(symbol, qty, price, reason)
        if side == "SELL":
            return self.portfolio.sell(symbol, qty, price, reason)
        raise ValueError(f"Unbekannte Order-Seite: {side!r}")
