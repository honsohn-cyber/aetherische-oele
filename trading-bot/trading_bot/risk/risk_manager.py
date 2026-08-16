"""Risikomanagement: Positionsgrößen, Stop-Loss/Take-Profit, Tagesverlust-Bremse.

Der Bot handelt nie "alles auf eine Karte" – jede Order wird über diese
Regeln begrenzt, bevor sie überhaupt beim Broker ankommt.
"""
from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass
class RiskManager:
    max_position_pct: float = 0.10
    max_open_positions: int = 8
    stop_loss_pct: float = 0.08
    take_profit_pct: float = 0.20
    max_daily_loss_pct: float = 0.03

    def position_size(self, equity: float, price: float) -> int:
        """Maximale Stückzahl, die für eine neue Position gekauft werden darf,
        begrenzt durch `max_position_pct` des aktuellen Depotwerts."""
        if price <= 0 or equity <= 0:
            return 0
        budget = equity * self.max_position_pct
        return max(math.floor(budget / price), 0)

    def can_open_position(self, current_open_positions: int) -> bool:
        return current_open_positions < self.max_open_positions

    def hit_stop_loss(self, entry_price: float, current_price: float) -> bool:
        if entry_price <= 0:
            return False
        return current_price <= entry_price * (1 - self.stop_loss_pct)

    def hit_take_profit(self, entry_price: float, current_price: float) -> bool:
        if entry_price <= 0:
            return False
        return current_price >= entry_price * (1 + self.take_profit_pct)

    def daily_loss_exceeded(self, equity_start_of_day: float, equity_now: float) -> bool:
        """True, wenn der Tagesverlust die Schwelle erreicht/überschreitet –
        der Bot sollte dann keine neuen Positionen mehr eröffnen."""
        if equity_start_of_day <= 0:
            return False
        loss_pct = (equity_start_of_day - equity_now) / equity_start_of_day
        return loss_pct >= self.max_daily_loss_pct

    @classmethod
    def from_config(cls, risk_config: dict) -> "RiskManager":
        return cls(
            max_position_pct=risk_config.get("max_position_pct", 0.10),
            max_open_positions=risk_config.get("max_open_positions", 8),
            stop_loss_pct=risk_config.get("stop_loss_pct", 0.08),
            take_profit_pct=risk_config.get("take_profit_pct", 0.20),
            max_daily_loss_pct=risk_config.get("max_daily_loss_pct", 0.03),
        )
