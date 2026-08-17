import numpy as np
import pandas as pd

from trading_bot.analysis.scorer import (
    StockAnalyzer,
    fundamentals_score,
    momentum_score,
    trend_score,
    volatility_score,
)


def _wave_df(n: int, start: float, slope: float, noise_amp=(2.0, 1.0)) -> pd.DataFrame:
    """Erzeugt einen deterministischen Kursverlauf mit klarer Tendenz
    (slope) plus realistischem Auf-und-Ab (Sinus-Rauschen), damit RSI nicht
    an den unrealistischen Extremwerten 0/100 einer rein monotonen Reihe
    klebt."""
    idx = pd.date_range("2023-01-01", periods=n, freq="D")
    t = np.arange(n)
    trend = start + t * slope
    noise = np.sin(t / 3.0) * noise_amp[0] + np.sin(t / 17.0) * noise_amp[1]
    close = pd.Series(trend + noise, index=idx)
    high, low = close + 1.0, close - 1.0
    return pd.DataFrame({"Open": close, "High": high, "Low": low, "Close": close})


# -- Teilkomponenten ----------------------------------------------------------


def test_trend_score_bullish_when_price_above_moving_averages():
    df = _wave_df(220, start=100, slope=0.12)
    score, reasons, metrics = trend_score(df)
    assert score == 1.0
    assert metrics["price"] > metrics["sma50"] > metrics["sma200"]
    assert any("über SMA50" in r for r in reasons)


def test_trend_score_bearish_when_price_below_moving_averages():
    df = _wave_df(220, start=200, slope=-0.18)
    score, reasons, metrics = trend_score(df)
    assert score == -1.0
    assert metrics["price"] < metrics["sma50"] < metrics["sma200"]


def test_trend_score_degrades_gracefully_with_little_data():
    df = _wave_df(30, start=100, slope=0.1)
    score, reasons, metrics = trend_score(df)
    assert score == 0.0
    assert metrics == {}
    assert "Zu wenige" in reasons[0]


def test_momentum_score_flags_overbought_and_oversold():
    up = _wave_df(90, start=100, slope=0.6, noise_amp=(0.5, 0.2))
    _, up_reasons, up_metrics = momentum_score(up)
    assert up_metrics["rsi"] > 70
    assert any("überkauft" in r for r in up_reasons)

    down = _wave_df(90, start=150, slope=-0.6, noise_amp=(0.5, 0.2))
    _, down_reasons, down_metrics = momentum_score(down)
    assert down_metrics["rsi"] < 30
    assert any("überverkauft" in r for r in down_reasons)


def test_volatility_score_prefers_calm_markets():
    calm = _wave_df(60, start=100, slope=0.0, noise_amp=(0.2, 0.1))
    choppy = _wave_df(60, start=100, slope=0.0, noise_amp=(8.0, 4.0))
    calm_score, _, _ = volatility_score(calm)
    choppy_score, _, _ = volatility_score(choppy)
    assert calm_score > choppy_score


def test_fundamentals_score_strong_vs_weak_company():
    strong = {"trailingPE": 14, "profitMargins": 0.18, "revenueGrowth": 0.15, "debtToEquity": 40}
    weak = {"trailingPE": 80, "profitMargins": -0.15, "revenueGrowth": -0.25, "debtToEquity": 300}
    strong_score, _, _ = fundamentals_score(strong)
    weak_score, _, _ = fundamentals_score(weak)
    assert strong_score > 0
    assert weak_score < 0
    assert strong_score > weak_score


def test_fundamentals_score_empty_when_no_data():
    score, reasons, metrics = fundamentals_score({})
    assert score == 0.0
    assert metrics == {}
    assert "Keine Fundamentaldaten" in reasons[0]


# -- Gesamt-Analyzer ------------------------------------------------------------


def test_analyzer_produces_buy_signal_for_bullish_setup():
    df = _wave_df(220, start=100, slope=0.12)
    fundamentals = {"trailingPE": 14, "profitMargins": 0.18, "revenueGrowth": 0.15, "debtToEquity": 40}
    analyzer = StockAnalyzer()
    result = analyzer.analyze("BULL", df, fundamentals)
    assert result.signal == "BUY"
    assert result.score > 0
    assert 0.0 <= result.confidence <= 1.0
    assert result.reasons  # jede Entscheidung ist begründet
    assert result.metrics["price"] > 0


def test_analyzer_produces_sell_signal_for_bearish_setup():
    df = _wave_df(220, start=200, slope=-0.18, noise_amp=(2.0, 1.0))
    fundamentals = {"trailingPE": 80, "profitMargins": -0.15, "revenueGrowth": -0.25, "debtToEquity": 300}
    analyzer = StockAnalyzer()
    result = analyzer.analyze("BEAR", df, fundamentals)
    assert result.signal == "SELL"
    assert result.score < 0


def test_analyzer_report_contains_symbol_and_signal():
    df = _wave_df(220, start=100, slope=0.12)
    analyzer = StockAnalyzer()
    result = analyzer.analyze("XYZ", df)
    report = result.report()
    assert "XYZ" in report
    assert result.signal in report
