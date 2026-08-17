"""Laden und Validieren der YAML-Konfiguration."""
from __future__ import annotations

import copy
import os
import re
from typing import Any

import yaml

_ENV_PATTERN = re.compile(r"\$\{([A-Za-z_][A-Za-z0-9_]*)\}")

DEFAULT_CONFIG: dict[str, Any] = {
    "watchlist": [],
    "analysis": {
        "lookback_days": 250,
        "weights": {
            "trend": 0.35,
            "momentum": 0.25,
            "volatility": 0.15,
            "fundamentals": 0.25,
        },
        "buy_score_threshold": 0.5,
        "sell_score_threshold": -0.35,
        "min_confidence": 0.5,
    },
    "risk": {
        "starting_cash": 10000.0,
        "fee_per_trade": 1.0,
        "max_position_pct": 0.10,
        "max_open_positions": 8,
        "stop_loss_pct": 0.08,
        "take_profit_pct": 0.20,
        "max_daily_loss_pct": 0.03,
    },
    "broker": {
        "mode": "paper",
        "trade_republic": {
            "enabled": False,
            "export_command": "pytr export_transactions {output}",
        },
    },
    "state": {
        "data_dir": "data",
        "log_dir": "logs",
    },
}


def _expand_env(value: Any) -> Any:
    """Ersetzt ${VAR}-Platzhalter rekursiv durch Umgebungsvariablen."""
    if isinstance(value, str):
        def repl(match: re.Match) -> str:
            return os.environ.get(match.group(1), "")

        return _ENV_PATTERN.sub(repl, value)
    if isinstance(value, dict):
        return {k: _expand_env(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_expand_env(v) for v in value]
    return value


def _deep_merge(base: dict, override: dict) -> dict:
    result = copy.deepcopy(base)
    for key, value in override.items():
        if isinstance(value, dict) and isinstance(result.get(key), dict):
            result[key] = _deep_merge(result[key], value)
        else:
            result[key] = value
    return result


def load_config(path: str) -> dict[str, Any]:
    """Lädt `path`, mischt fehlende Werte mit DEFAULT_CONFIG und expandiert
    ${ENV_VAR}-Platzhalter (z. B. für Trade-Republic-Zugangsdaten)."""
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Konfigurationsdatei '{path}' nicht gefunden. "
            f"Kopiere config.example.yaml nach config.yaml und passe sie an."
        )
    with open(path, encoding="utf-8") as f:
        raw = yaml.safe_load(f) or {}
    merged = _deep_merge(DEFAULT_CONFIG, raw)
    return _expand_env(merged)
