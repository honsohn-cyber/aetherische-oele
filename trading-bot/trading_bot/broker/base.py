"""Gemeinsame Schnittstelle für alle Broker-Anbindungen (Paper-Portfolio,
Trade-Republic-Sync, künftig ggf. weitere)."""
from __future__ import annotations

from abc import ABC, abstractmethod


class Broker(ABC):
    @abstractmethod
    def get_cash(self) -> float:
        ...

    @abstractmethod
    def get_positions(self) -> dict[str, dict[str, float]]:
        ...

    @abstractmethod
    def equity(self, prices: dict[str, float]) -> float:
        ...

    @abstractmethod
    def execute(self, symbol: str, side: str, qty: float, price: float, reason: str = "") -> object:
        """Führt eine Order aus (BUY/SELL). Muss bei nicht unterstützten
        Brokern (z. B. echte Order-Ausführung bei Trade Republic) eine
        aussagekräftige Exception werfen statt stillschweigend zu scheitern."""
