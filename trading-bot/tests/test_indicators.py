import numpy as np
import pandas as pd

from trading_bot.analysis import indicators as ind


def _uptrend_df(n=120):
    idx = pd.date_range("2023-01-01", periods=n, freq="D")
    close = pd.Series(np.linspace(100, 200, n), index=idx)
    high = close + 1
    low = close - 1
    return pd.DataFrame({"Open": close, "High": high, "Low": low, "Close": close})


def _downtrend_df(n=120):
    idx = pd.date_range("2023-01-01", periods=n, freq="D")
    close = pd.Series(np.linspace(200, 100, n), index=idx)
    high = close + 1
    low = close - 1
    return pd.DataFrame({"Open": close, "High": high, "Low": low, "Close": close})


def test_sma_matches_manual_mean():
    s = pd.Series([1, 2, 3, 4, 5])
    result = ind.sma(s, 3)
    assert np.isnan(result.iloc[0])
    assert np.isnan(result.iloc[1])
    assert result.iloc[2] == 2.0  # mean(1,2,3)
    assert result.iloc[4] == 4.0  # mean(3,4,5)


def test_ema_reacts_faster_than_sma_to_recent_move():
    s = pd.Series([10] * 30 + [20] * 5)
    sma_val = ind.sma(s, 10).iloc[-1]
    ema_val = ind.ema(s, 10).iloc[-1]
    assert ema_val > sma_val  # EMA gewichtet neuere (höhere) Werte stärker


def test_rsi_high_in_strong_uptrend():
    df = _uptrend_df()
    r = ind.rsi(df["Close"]).iloc[-1]
    assert r > 70


def test_rsi_low_in_strong_downtrend():
    df = _downtrend_df()
    r = ind.rsi(df["Close"]).iloc[-1]
    assert r < 30


def test_rsi_bounded_0_100():
    df = _uptrend_df()
    r = ind.rsi(df["Close"]).dropna()
    assert (r >= 0).all() and (r <= 100).all()


def test_macd_positive_histogram_in_uptrend():
    df = _uptrend_df()
    _, _, hist = ind.macd(df["Close"])
    assert hist.iloc[-1] > 0


def test_bollinger_bands_ordering():
    df = _uptrend_df()
    mid, upper, lower = ind.bollinger_bands(df["Close"])
    valid = mid.notna()
    assert (upper[valid] >= mid[valid]).all()
    assert (mid[valid] >= lower[valid]).all()


def test_atr_non_negative():
    df = _uptrend_df()
    a = ind.atr(df["High"], df["Low"], df["Close"]).dropna()
    assert (a >= 0).all()
