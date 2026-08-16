"""READ-ONLY-Anbindung an ein echtes Trade-Republic-Depot über das
inoffizielle, quelloffene Community-Projekt `pytr`
(https://github.com/pytr-org/pytr) – NICHT von Trade Republic selbst
bereitgestellt oder unterstützt.

WARUM READ-ONLY?
-----------------
Trade Republic bietet keine offizielle, öffentliche Trading-API an. Jede
automatisierte Order-Ausführung müsste daher eine inoffizielle, reverse-
engineerte Schnittstelle nutzen. Das:

  1. verstößt mutmaßlich gegen die Nutzungsbedingungen von Trade Republic
     (Bots/automatisierter Handel sind dort untersagt) und kann zur
     Kontosperrung führen,
  2. ist technisch fragil, da sich private APIs ohne Ankündigung ändern
     können,
  3. birgt bei Fehlern ein reales finanzielles Risiko (Fehlorder mit
     echtem Geld).

Dieser Bot platziert deshalb **niemals** echte Orders bei Trade Republic.
Diese Klasse dient ausschließlich dazu, Kontostand & Positionen eines
echten Depots zu importieren (z. B. um Positionsgrößen realistisch am
tatsächlichen Kapital auszurichten oder Klumpenrisiken zu vermeiden). Der
eigentliche, automatisierte Handel läuft immer über das kostenlose
Paper-Portfolio (`trading_bot.portfolio.PaperPortfolio`).

SETUP
-----
1. `pip install pytr`
2. Einmalig interaktiv einloggen (Telefonnummer + PIN, Bestätigung per
   Trade-Republic-App): `pytr login`
3. In `config.yaml` unter `broker.trade_republic.enabled: true` setzen.
4. `python -m trading_bot.cli sync-trade-republic` ausführen.

Das Export-Format von `pytr` kann sich je nach Version ändern – der Parser
unten ist bewusst tolerant/heuristisch gehalten und sollte bei Bedarf an
die tatsächliche CSV-Struktur angepasst werden.
"""
from __future__ import annotations

import csv
import logging
import shutil
import subprocess

from .base import Broker

logger = logging.getLogger(__name__)


class TradeRepublicUnavailableError(RuntimeError):
    """pytr ist nicht installiert/eingeloggt oder der Export ist fehlgeschlagen."""


class TradeRepublicReadOnlyBroker(Broker):
    def __init__(
        self,
        cash: float = 0.0,
        positions: dict[str, dict[str, float]] | None = None,
    ):
        self._cash = cash
        self._positions = positions or {}

    # -- Broker-Schnittstelle -----------------------------------------------

    def get_cash(self) -> float:
        return self._cash

    def get_positions(self) -> dict[str, dict[str, float]]:
        return self._positions

    def equity(self, prices: dict[str, float]) -> float:
        value = self._cash
        for symbol, pos in self._positions.items():
            price = prices.get(symbol, pos.get("avg_price", 0.0))
            value += pos.get("qty", 0.0) * price
        return value

    def execute(self, symbol: str, side: str, qty: float, price: float, reason: str = "") -> None:
        raise NotImplementedError(
            "Automatisierte Order-Ausführung bei Trade Republic ist in diesem Bot "
            "bewusst NICHT implementiert (keine offizielle Trading-API, Risiko eines "
            "ToS-Verstoßes und von Fehlorders mit echtem Geld). Nutze das "
            "Paper-Portfolio zum automatisierten Testen und platziere vom Bot "
            "vorgeschlagene Trades bei Bedarf manuell in der Trade-Republic-App."
        )

    # -- Sync -----------------------------------------------------------------

    @classmethod
    def sync(cls, export_command_template: str, output_path: str) -> "TradeRepublicReadOnlyBroker":
        """Ruft die lokal installierte `pytr`-CLI auf, um einen Export des
        echten Depots zu erzeugen, und liest daraus Kontostand + Positionen."""
        if shutil.which("pytr") is None:
            raise TradeRepublicUnavailableError(
                "`pytr` ist nicht installiert oder nicht im PATH. Installiere es mit "
                "`pip install pytr` und führe einmalig `pytr login` aus (siehe README, "
                "Abschnitt 'Trade Republic Anbindung')."
            )

        command = export_command_template.format(output=output_path)
        logger.info("Führe Trade-Republic-Export aus: %s", command)
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode != 0:
            raise TradeRepublicUnavailableError(
                f"Export-Kommando '{command}' fehlgeschlagen (Exit-Code {result.returncode}): "
                f"{result.stderr.strip() or result.stdout.strip()}"
            )

        cash, positions = cls._parse_export(output_path)
        return cls(cash=cash, positions=positions)

    @staticmethod
    def _parse_export(path: str) -> tuple[float, dict[str, dict[str, float]]]:
        """Best-effort-Parser für den pytr-CSV-Export. Sucht heuristisch nach
        gängigen Spaltennamen (deutsch/englisch), da sich das exakte Format
        je nach pytr-Version unterscheiden kann."""
        positions: dict[str, dict[str, float]] = {}
        cash = 0.0

        symbol_keys = ("isin", "symbol", "ticker", "wertpapier")
        qty_keys = ("qty", "quantity", "stück", "stueck", "anzahl", "shares")
        price_keys = ("avg_price", "average_price", "einstandskurs", "buy_price", "price")
        cash_keys = ("cash", "verrechnungskonto", "kontostand", "balance")

        try:
            with open(path, newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                if not reader.fieldnames:
                    raise TradeRepublicUnavailableError(f"Export-Datei '{path}' ist leer oder ungültig.")

                lower_fields = {name.lower(): name for name in reader.fieldnames}

                def find(keys: tuple[str, ...]) -> str | None:
                    for key in keys:
                        for lower_name, original in lower_fields.items():
                            if key in lower_name:
                                return original
                    return None

                symbol_col = find(symbol_keys)
                qty_col = find(qty_keys)
                price_col = find(price_keys)
                cash_col = find(cash_keys)

                for row in reader:
                    if cash_col and row.get(cash_col):
                        try:
                            cash = float(str(row[cash_col]).replace(",", "."))
                        except ValueError:
                            pass
                    if symbol_col and row.get(symbol_col):
                        symbol = row[symbol_col].strip()
                        try:
                            qty = float(str(row.get(qty_col, "0") or "0").replace(",", "."))
                            avg_price = float(str(row.get(price_col, "0") or "0").replace(",", "."))
                        except ValueError:
                            continue
                        if qty > 0:
                            positions[symbol] = {"qty": qty, "avg_price": avg_price}
        except FileNotFoundError as exc:
            raise TradeRepublicUnavailableError(f"Export-Datei '{path}' wurde nicht gefunden.") from exc

        if not positions and cash == 0.0:
            logger.warning(
                "Konnte weder Kontostand noch Positionen aus '%s' auslesen – "
                "vermutlich hat sich das pytr-Exportformat geändert. Bitte "
                "`TradeRepublicReadOnlyBroker._parse_export` anpassen oder die "
                "Datei manuell prüfen.",
                path,
            )

        return cash, positions
