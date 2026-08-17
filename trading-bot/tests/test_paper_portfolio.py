import json
import os

import pytest

from trading_bot.portfolio.paper_portfolio import (
    InsufficientFundsError,
    InsufficientSharesError,
    PaperPortfolio,
)


def test_buy_deducts_cash_and_fee():
    p = PaperPortfolio(starting_cash=1000.0, fee_per_trade=1.0)
    trade = p.buy("AAPL", qty=2, price=100.0, reason="test")
    assert trade.side == "BUY"
    assert p.cash == pytest.approx(1000.0 - 200.0 - 1.0)
    assert p.positions["AAPL"]["qty"] == 2
    assert p.positions["AAPL"]["avg_price"] == 100.0


def test_buy_averages_price_on_second_purchase():
    p = PaperPortfolio(starting_cash=10000.0, fee_per_trade=0.0)
    p.buy("AAPL", qty=10, price=100.0)
    p.buy("AAPL", qty=10, price=200.0)
    pos = p.positions["AAPL"]
    assert pos["qty"] == 20
    assert pos["avg_price"] == pytest.approx(150.0)


def test_buy_raises_when_insufficient_funds():
    p = PaperPortfolio(starting_cash=50.0, fee_per_trade=1.0)
    with pytest.raises(InsufficientFundsError):
        p.buy("AAPL", qty=10, price=100.0)
    assert p.cash == 50.0  # unveränderter Zustand nach fehlgeschlagenem Kauf


def test_sell_adds_cash_and_removes_position():
    p = PaperPortfolio(starting_cash=1000.0, fee_per_trade=1.0)
    p.buy("AAPL", qty=5, price=100.0)
    cash_after_buy = p.cash
    trade = p.sell("AAPL", qty=5, price=110.0)
    assert trade.side == "SELL"
    assert "AAPL" not in p.positions
    assert p.cash == pytest.approx(cash_after_buy + 5 * 110.0 - 1.0)


def test_sell_raises_when_insufficient_shares():
    p = PaperPortfolio(starting_cash=1000.0)
    with pytest.raises(InsufficientSharesError):
        p.sell("AAPL", qty=1, price=100.0)

    p.buy("AAPL", qty=2, price=100.0)
    with pytest.raises(InsufficientSharesError):
        p.sell("AAPL", qty=5, price=100.0)


def test_equity_and_summary_reflect_unrealized_pnl():
    p = PaperPortfolio(starting_cash=1000.0, fee_per_trade=0.0)
    p.buy("AAPL", qty=10, price=100.0)
    prices = {"AAPL": 120.0}
    assert p.equity(prices) == pytest.approx(0.0 + 10 * 120.0)
    summary = p.summary(prices)
    assert summary["positions"][0]["unrealized_pnl"] == pytest.approx(200.0)
    assert summary["total_pnl"] == pytest.approx(200.0)


def test_save_and_load_roundtrip(tmp_path):
    state_path = str(tmp_path / "portfolio.json")
    p = PaperPortfolio(starting_cash=5000.0, fee_per_trade=1.0, state_path=state_path)
    p.buy("MSFT", qty=3, price=300.0, reason="unit-test")

    assert os.path.exists(state_path)

    p2 = PaperPortfolio(starting_cash=5000.0, fee_per_trade=1.0, state_path=state_path)
    assert p2.cash == p.cash
    assert p2.positions == p.positions
    assert len(p2.trades) == 1
    assert p2.trades[0].symbol == "MSFT"

    with open(state_path, encoding="utf-8") as f:
        raw = json.load(f)
    assert raw["positions"]["MSFT"]["qty"] == 3


def test_reset_restores_starting_cash():
    p = PaperPortfolio(starting_cash=1000.0, fee_per_trade=0.0)
    p.buy("AAPL", qty=1, price=100.0)
    p.reset()
    assert p.cash == 1000.0
    assert p.positions == {}
    assert p.trades == []
