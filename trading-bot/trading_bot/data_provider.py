"""Marktdaten-Zugriff über yfinance (Kurse + Fundamentaldaten) mit
einfachem In-Memory-Cache, damit ein Analyse-Zyklus nicht mehrfach dieselben
Daten nachlädt."""
from __future__ import annotations

import logging
import time
from typing import Any

import pandas as pd

logger = logging.getLogger(__name__)

# Relevante Felder aus yfinance Ticker.info für die Fundamentalanalyse.
_FUNDAMENTAL_FIELDS = [
    "trailingPE",
    "forwardPE",
    "profitMargins",
    "revenueGrowth",
    "earningsGrowth",
    "returnOnEquity",
    "debtToEquity",
    "marketCap",
    "sector",
    "longName",
]


class DataProviderError(RuntimeError):
    """Wird ausgelöst, wenn für ein Symbol keine Daten geladen werden können
    (z. B. fehlerhaftes Ticker-Symbol oder kein Netzwerkzugriff)."""


class DataProvider:
    def __init__(self, cache_ttl_seconds: int = 900):
        self.cache_ttl_seconds = cache_ttl_seconds
        self._history_cache: dict[tuple[str, str, str], tuple[float, pd.DataFrame]] = {}
        self._fundamentals_cache: dict[str, tuple[float, dict]] = {}

    def get_history(self, symbol: str, period: str = "1y", interval: str = "1d") -> pd.DataFrame:
        key = (symbol, period, interval)
        cached = self._history_cache.get(key)
        now = time.time()
        if cached and now - cached[0] < self.cache_ttl_seconds:
            return cached[1]

        try:
            import yfinance as yf

            ticker = yf.Ticker(symbol)
            df = ticker.history(period=period, interval=interval, auto_adjust=True)
        except Exception as exc:  # pragma: no cover - Netzwerk-/API-Fehler
            raise DataProviderError(f"Konnte Kursdaten für '{symbol}' nicht laden: {exc}") from exc

        if df is None or df.empty:
            raise DataProviderError(
                f"Keine Kursdaten für '{symbol}' erhalten (ungültiges Symbol oder kein Netzwerkzugriff?)."
            )

        df = df[["Open", "High", "Low", "Close", "Volume"]].dropna()
        self._history_cache[key] = (now, df)
        return df

    def get_fundamentals(self, symbol: str) -> dict[str, Any]:
        cached = self._fundamentals_cache.get(symbol)
        now = time.time()
        if cached and now - cached[0] < self.cache_ttl_seconds:
            return cached[1]

        try:
            import yfinance as yf

            ticker = yf.Ticker(symbol)
            info = ticker.get_info() if hasattr(ticker, "get_info") else ticker.info
        except Exception as exc:  # pragma: no cover
            logger.warning("Fundamentaldaten für '%s' nicht verfügbar: %s", symbol, exc)
            info = {}

        fundamentals = {k: info.get(k) for k in _FUNDAMENTAL_FIELDS if info.get(k) is not None}
        self._fundamentals_cache[symbol] = (now, fundamentals)
        return fundamentals

    def get_last_price(self, symbol: str) -> float:
        df = self.get_history(symbol, period="5d", interval="1d")
        return float(df["Close"].iloc[-1])
