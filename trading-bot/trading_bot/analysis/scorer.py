"""Kombiniert technische und fundamentale Signale zu einem nachvollziehbaren
Handelssignal. Jede Teilbewertung liefert neben einem Score (-1..+1) auch eine
menschenlesbare Begründung, damit jede Entscheidung des Bots im Nachhinein
geprüft werden kann ("genau analysieren, bevor gehandelt wird").

WICHTIG: Dies ist ein einfaches, heuristisches Modell zu Lern-/Testzwecken.
Es ist KEINE Anlageberatung und garantiert keine profitable Strategie.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import pandas as pd

from . import indicators as ind


def _clip(value: float, lo: float = -1.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, value))


@dataclass
class AnalysisResult:
    symbol: str
    signal: str  # "BUY" | "SELL" | "HOLD"
    score: float
    confidence: float
    reasons: list[str] = field(default_factory=list)
    metrics: dict[str, Any] = field(default_factory=dict)

    def report(self) -> str:
        lines = [f"=== Analyse {self.symbol} → {self.signal} ==="]
        lines.append(f"Score: {self.score:+.2f}  |  Konfidenz: {self.confidence:.2f}")
        lines.extend(f"  - {reason}" for reason in self.reasons)
        return "\n".join(lines)


def trend_score(df: pd.DataFrame) -> tuple[float, list[str], dict[str, Any]]:
    close = df["Close"]
    if len(close) < 60:
        return 0.0, ["Zu wenige Kursdaten (<60 Handelstage) für eine verlässliche Trendanalyse."], {}

    long_window = min(len(close), 200)
    price = float(close.iloc[-1])
    sma50 = float(ind.sma(close, 50).iloc[-1])
    sma_long = float(ind.sma(close, long_window).iloc[-1])

    signals = []
    reasons = []

    s = 1.0 if price > sma50 else -1.0
    signals.append(s)
    reasons.append(f"Kurs {price:.2f} liegt {'über' if s > 0 else 'unter'} SMA50 ({sma50:.2f})")

    s = 1.0 if price > sma_long else -1.0
    signals.append(s)
    reasons.append(
        f"Kurs {price:.2f} liegt {'über' if s > 0 else 'unter'} SMA{long_window} ({sma_long:.2f})"
    )

    s = 1.0 if sma50 > sma_long else -1.0
    signals.append(s)
    reasons.append(
        f"SMA50 liegt {'über' if s > 0 else 'unter'} SMA{long_window} "
        f"→ {'bullishe Trendstruktur' if s > 0 else 'bearishe Trendstruktur'}"
    )

    score = sum(signals) / len(signals)
    metrics = {"price": price, "sma50": sma50, f"sma{long_window}": sma_long}
    return score, reasons, metrics


def momentum_score(df: pd.DataFrame) -> tuple[float, list[str], dict[str, Any]]:
    close = df["Close"]
    if len(close) < 35:
        return 0.0, ["Zu wenige Kursdaten (<35 Handelstage) für Momentumanalyse (RSI/MACD)."], {}

    price = float(close.iloc[-1])
    r = float(ind.rsi(close).iloc[-1])
    _, _, hist_series = ind.macd(close)
    hist = float(hist_series.iloc[-1])

    rsi_signal = _clip((50 - r) / 30)
    macd_signal = _clip(hist / (0.01 * price)) if price else 0.0
    score = 0.5 * rsi_signal + 0.5 * macd_signal

    reasons = []
    if r < 30:
        reasons.append(f"RSI(14) = {r:.1f} → überverkauft, mögliche Erholung (bullisches Signal)")
    elif r > 70:
        reasons.append(f"RSI(14) = {r:.1f} → überkauft, Korrekturrisiko (bärisches Signal)")
    else:
        reasons.append(f"RSI(14) = {r:.1f} → neutraler Bereich")

    if hist > 0:
        reasons.append(f"MACD-Histogramm = {hist:+.3f} → unterstützt Aufwärtsmomentum")
    elif hist < 0:
        reasons.append(f"MACD-Histogramm = {hist:+.3f} → unterstützt Abwärtsmomentum")
    else:
        reasons.append("MACD-Histogramm = 0.000 → neutral")

    metrics = {"rsi": r, "macd_hist": hist}
    return score, reasons, metrics


def volatility_score(df: pd.DataFrame) -> tuple[float, list[str], dict[str, Any]]:
    if len(df) < 20:
        return 0.0, ["Zu wenige Kursdaten (<20 Handelstage) für Volatilitätsanalyse."], {}

    price = float(df["Close"].iloc[-1])
    a = float(ind.atr(df["High"], df["Low"], df["Close"]).iloc[-1])
    vol_ratio = a / price if price else 0.0

    score = _clip(1 - vol_ratio / 0.05)
    if vol_ratio < 0.02:
        level = "niedrig"
    elif vol_ratio < 0.04:
        level = "moderat"
    else:
        level = "hoch (erhöhtes Risiko, kleinere Positionsgröße sinnvoll)"

    reasons = [f"ATR(14)/Kurs = {vol_ratio:.2%} → Volatilität {level}"]
    metrics = {"atr": a, "vol_ratio": vol_ratio}
    return score, reasons, metrics


def fundamentals_score(info: dict[str, Any]) -> tuple[float, list[str], dict[str, Any]]:
    if not info:
        return 0.0, ["Keine Fundamentaldaten verfügbar."], {}

    subscores: list[float] = []
    reasons: list[str] = []
    metrics: dict[str, Any] = {}

    pe = info.get("trailingPE")
    if pe and pe > 0:
        metrics["pe"] = pe
        if pe < 10:
            s, label = 1.0, "günstig bewertet"
        elif pe < 25:
            s, label = 0.5, "moderat bewertet"
        elif pe < 40:
            s, label = -0.3, "hoch bewertet"
        else:
            s, label = -1.0, "sehr hoch bewertet"
        subscores.append(s)
        reasons.append(f"KGV (trailing) = {pe:.1f} → {label}")

    margin = info.get("profitMargins")
    if margin is not None:
        metrics["profit_margin"] = margin
        s = _clip(margin / 0.15)
        subscores.append(s)
        label = "solide Profitabilität" if margin > 0.1 else ("negative Marge" if margin < 0 else "schwache Profitabilität")
        reasons.append(f"Nettomarge = {margin:.1%} → {label}")

    rev_growth = info.get("revenueGrowth")
    if rev_growth is not None:
        metrics["revenue_growth"] = rev_growth
        s = _clip(rev_growth / 0.15)
        subscores.append(s)
        label = "starkes Wachstum" if rev_growth > 0.1 else ("schrumpfender Umsatz" if rev_growth < 0 else "moderates Wachstum")
        reasons.append(f"Umsatzwachstum = {rev_growth:.1%} → {label}")

    d2e = info.get("debtToEquity")
    if d2e is not None:
        ratio = d2e / 100  # yfinance liefert debtToEquity typischerweise in Prozent
        metrics["debt_to_equity"] = ratio
        s = _clip(1 - ratio / 1.5)
        subscores.append(s)
        label = "niedrig" if ratio < 0.5 else ("moderat" if ratio < 1.5 else "hoch")
        reasons.append(f"Verschuldungsgrad (Debt/Equity) = {ratio:.2f} → {label}")

    if not subscores:
        return 0.0, ["Fundamentaldaten unvollständig – kein Fundamental-Score berechnet."], {}

    score = sum(subscores) / len(subscores)
    return score, reasons, metrics


class StockAnalyzer:
    """Fasst Trend-, Momentum-, Volatilitäts- und Fundamentalanalyse zu einem
    gewichteten Gesamt-Score sowie einem BUY/SELL/HOLD-Signal zusammen."""

    def __init__(
        self,
        weights: dict[str, float] | None = None,
        buy_threshold: float = 0.5,
        sell_threshold: float = -0.35,
        min_confidence: float = 0.5,
    ):
        self.weights = weights or {
            "trend": 0.35,
            "momentum": 0.25,
            "volatility": 0.15,
            "fundamentals": 0.25,
        }
        self.buy_threshold = buy_threshold
        self.sell_threshold = sell_threshold
        self.min_confidence = min_confidence

    def analyze(
        self, symbol: str, df: pd.DataFrame, fundamentals: dict[str, Any] | None = None
    ) -> AnalysisResult:
        fundamentals = fundamentals or {}

        t_score, t_reasons, t_metrics = trend_score(df)
        m_score, m_reasons, m_metrics = momentum_score(df)
        v_score, v_reasons, v_metrics = volatility_score(df)
        f_score, f_reasons, f_metrics = fundamentals_score(fundamentals)

        components = {
            "trend": t_score,
            "momentum": m_score,
            "volatility": v_score,
            "fundamentals": f_score,
        }
        total_weight = sum(self.weights.get(name, 0.0) for name in components) or 1.0
        score = sum(components[name] * self.weights.get(name, 0.0) for name in components) / total_weight
        score = _clip(score)

        # Konfidenz: wie einig sind sich die Teilanalysen (Vorzeichen) +
        # Bonus, wenn echte Fundamentaldaten vorlagen.
        signs = [1 if v > 0.05 else (-1 if v < -0.05 else 0) for v in components.values()]
        nonzero = [s for s in signs if s != 0]
        agreement = (abs(sum(nonzero)) / len(nonzero)) if nonzero else 0.0
        fundamentals_bonus = 1.0 if fundamentals else 0.6
        confidence = _clip(0.6 * agreement + 0.4 * fundamentals_bonus, 0.0, 1.0)

        if score >= self.buy_threshold and confidence >= self.min_confidence:
            signal = "BUY"
        elif score <= self.sell_threshold:
            signal = "SELL"
        else:
            signal = "HOLD"

        reasons = [*t_reasons, *m_reasons, *v_reasons, *f_reasons]
        reasons.append(
            f"Gesamt-Score = {score:+.2f} (Kauf ≥ {self.buy_threshold:+.2f}, "
            f"Verkauf ≤ {self.sell_threshold:+.2f}), Konfidenz = {confidence:.2f} → Signal: {signal}"
        )

        metrics = {**t_metrics, **m_metrics, **v_metrics, **f_metrics}
        return AnalysisResult(
            symbol=symbol,
            signal=signal,
            score=score,
            confidence=confidence,
            reasons=reasons,
            metrics=metrics,
        )
