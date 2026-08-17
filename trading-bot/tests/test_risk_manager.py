import pytest

from trading_bot.risk.risk_manager import RiskManager


def test_position_size_respects_max_position_pct():
    rm = RiskManager(max_position_pct=0.10)
    qty = rm.position_size(equity=10000.0, price=50.0)
    # Budget = 1000, bei Kurs 50 -> 20 Stück
    assert qty == 20


def test_position_size_zero_for_invalid_inputs():
    rm = RiskManager()
    assert rm.position_size(equity=0.0, price=50.0) == 0
    assert rm.position_size(equity=10000.0, price=0.0) == 0


def test_can_open_position_respects_limit():
    rm = RiskManager(max_open_positions=3)
    assert rm.can_open_position(2) is True
    assert rm.can_open_position(3) is False


def test_stop_loss_triggers_below_threshold():
    rm = RiskManager(stop_loss_pct=0.08)
    assert rm.hit_stop_loss(entry_price=100.0, current_price=91.0) is True
    assert rm.hit_stop_loss(entry_price=100.0, current_price=93.0) is False


def test_take_profit_triggers_above_threshold():
    rm = RiskManager(take_profit_pct=0.20)
    assert rm.hit_take_profit(entry_price=100.0, current_price=121.0) is True
    assert rm.hit_take_profit(entry_price=100.0, current_price=115.0) is False


def test_daily_loss_guard():
    rm = RiskManager(max_daily_loss_pct=0.03)
    assert rm.daily_loss_exceeded(equity_start_of_day=10000.0, equity_now=9600.0) is True
    assert rm.daily_loss_exceeded(equity_start_of_day=10000.0, equity_now=9800.0) is False


def test_from_config_uses_defaults_for_missing_keys():
    rm = RiskManager.from_config({"max_position_pct": 0.2})
    assert rm.max_position_pct == 0.2
    assert rm.max_open_positions == 8  # Default
