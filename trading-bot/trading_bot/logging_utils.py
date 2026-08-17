"""Logging-Setup: Konsole + Datei-Log + strukturiertes Entscheidungs-Protokoll
(JSONL), damit jede Kauf-/Verkauf-/Halten-Entscheidung im Nachhinein
nachvollziehbar bleibt."""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone


def setup_logging(log_dir: str, level: int = logging.INFO) -> None:
    os.makedirs(log_dir, exist_ok=True)
    log_path = os.path.join(log_dir, "bot.log")

    root = logging.getLogger()
    root.setLevel(level)
    root.handlers.clear()

    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(fmt)
    root.addHandler(console_handler)

    file_handler = logging.FileHandler(log_path, encoding="utf-8")
    file_handler.setFormatter(fmt)
    root.addHandler(file_handler)


class DecisionLogger:
    """Schreibt jede Analyse-/Handelsentscheidung als eine Zeile JSON
    (JSON Lines) fort – ein einfaches, greppable Audit-Log."""

    def __init__(self, log_dir: str):
        os.makedirs(log_dir, exist_ok=True)
        self.path = os.path.join(log_dir, "decisions.jsonl")

    def log(self, **fields) -> None:
        entry = {"timestamp": datetime.now(timezone.utc).isoformat(), **fields}
        with open(self.path, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False, default=str) + "\n")
