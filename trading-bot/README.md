# Trading-Bot – Aktienanalyse, Paper-Trading & Trade-Republic-Anbindung

Ein Python-Bot, der Aktien anhand von Trend-, Momentum-, Volatilitäts- und
Fundamentaldaten **analysiert und begründet**, bevor er handelt, und der
Handel standardmäßig **kostenlos und risikofrei über ein simuliertes
Test-Portfolio** abwickelt. Optional kann ein echtes Trade-Republic-Depot
**read-only** eingebunden werden.

> ⚠️ **Kein Anlageberater.** Dieses Projekt ist ein Lern-/Experimentier-Tool.
> Die Signale basieren auf einfachen, transparenten Heuristiken – sie sind
> **keine Finanz- oder Anlageberatung** und garantieren keinen Erfolg. Handel
> mit echtem Geld erfolgt ausschließlich auf eigenes Risiko.

## Was der Bot tut

1. **Lädt Kurs- und Fundamentaldaten** (via [yfinance](https://github.com/ranaroussi/yfinance)).
2. **Analysiert jede Aktie in vier Dimensionen**, bevor irgendeine
   Entscheidung fällt:
   - **Trend** – Kurs vs. SMA50/SMA200, Golden-/Death-Cross-Struktur
   - **Momentum** – RSI(14), MACD-Histogramm
   - **Volatilität** – ATR(14) relativ zum Kurs (Risikoeinschätzung)
   - **Fundamentaldaten** – KGV, Nettomarge, Umsatzwachstum, Verschuldungsgrad
3. Kombiniert die vier Teil-Scores gewichtet zu einem **Gesamt-Score
   (-1 … +1)** und einer **Konfidenz (0 … 1)** → Signal `BUY` / `HOLD` / `SELL`.
4. **Jede Entscheidung wird mit einer nachvollziehbaren Begründung protokolliert**
   (Konsole, `logs/bot.log`, `logs/decisions.jsonl`) – nichts passiert
   "im Blindflug".
5. Vor jedem Trade greift ein **Risikomanagement**: maximale Positionsgröße,
   maximale Anzahl offener Positionen, Stop-Loss, Take-Profit und eine
   Tagesverlust-Bremse.
6. Der eigentliche Kauf/Verkauf läuft über das **kostenlose Paper-Portfolio**
   (siehe unten) – standardmäßig ohne jedes echte Risiko.

## Schnellstart

```bash
cd trading-bot
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp config.example.yaml config.yaml
# config.yaml anpassen: eigene Watchlist, Risikoparameter etc.

# Einzelne Aktie analysieren (ohne zu handeln):
python -m trading_bot.cli analyze --symbol AAPL

# Ganze Watchlist analysieren:
python -m trading_bot.cli analyze

# Einen Handelszyklus über die Watchlist ausführen (Paper-Trading):
python -m trading_bot.cli run --once

# Test-Portfolio ansehen:
python -m trading_bot.cli portfolio

# Test-Portfolio auf Startkapital zurücksetzen:
python -m trading_bot.cli reset-portfolio
```

Für Dauerbetrieb (z. B. alle 30 Minuten während der Börsenöffnungszeiten):

```bash
python -m trading_bot.cli run --interval 30
```

(Für echten Dauerbetrieb empfiehlt sich ein Cronjob/systemd-Timer statt
den Prozess durchlaufen zu lassen – der Bot ist zustandslos zwischen
Aufrufen, der komplette Stand liegt in `data/`.)

## Das kostenlose Test-Portfolio (Paper-Trading)

- Startet mit virtuellem Kapital (Standard: 10.000, einstellbar in
  `config.yaml` unter `risk.starting_cash`).
- Simuliert Käufe/Verkäufe **inklusive einer Handelsgebühr** pro Trade
  (Standard 1,00 – realistisch angelehnt an Trade Republic), damit die
  Ergebnisse nicht zu optimistisch sind.
- Der komplette Zustand (Kasse, Positionen, Trade-Historie) wird nach jedem
  Trade automatisch in `data/portfolio.json` gespeichert.
- **Kein echtes Geld, kein echtes Konto nötig** – perfekt zum Testen der
  Strategie, bevor (falls überhaupt) echtes Kapital eingesetzt wird.

## Architektur

```
trading_bot/
  data_provider.py        Kurs-/Fundamentaldaten (yfinance) mit Cache
  analysis/
    indicators.py         SMA, EMA, RSI, MACD, Bollinger-Bänder, ATR
    scorer.py              StockAnalyzer: kombiniert Signale → Score + Begründung
  risk/
    risk_manager.py         Positionsgröße, Stop-Loss/Take-Profit, Tagesverlust-Bremse
  portfolio/
    paper_portfolio.py      Kostenloses simuliertes Test-Portfolio
  broker/
    base.py                 Gemeinsame Broker-Schnittstelle
    paper_broker.py         Broker-Adapter für das Test-Portfolio (Standard)
    trade_republic_broker.py  READ-ONLY-Depotabgleich via `pytr` (siehe unten)
  engine.py                 Orchestriert Analyse → Risikoprüfung → Order → Logging
  cli.py                     Kommandozeilen-Interface
```

Jede Komponente ist einzeln testbar und ausgetauscht (z. B. ein weiterer
Broker-Adapter), ohne die anderen anzufassen.

## Konfiguration (`config.yaml`)

Wichtigste Stellschrauben (siehe `config.example.yaml` für alle Details):

| Schlüssel | Bedeutung |
|---|---|
| `watchlist` | zu beobachtende/handelnde Ticker-Symbole (yfinance-Format) |
| `analysis.weights` | Gewichtung von Trend/Momentum/Volatilität/Fundamentaldaten |
| `analysis.buy_score_threshold` / `sell_score_threshold` | Schwellenwerte für Signale |
| `risk.starting_cash` | Startkapital des Test-Portfolios |
| `risk.max_position_pct` | max. Anteil des Depotwerts pro Position |
| `risk.stop_loss_pct` / `take_profit_pct` | automatische Absicherung offener Positionen |
| `risk.max_daily_loss_pct` | Bot pausiert Neu-Käufe nach Erreichen des Tagesverlust-Limits |
| `broker.mode` | `paper` (Standard) |

## Trade Republic Anbindung

**Wichtiger Hintergrund:** Trade Republic bietet **keine offizielle,
öffentliche Trading-API**. Jede automatisierte Order-Ausführung müsste
daher eine inoffizielle, reverse-engineerte Schnittstelle nutzen – das
verstößt mutmaßlich gegen die Nutzungsbedingungen von Trade Republic
(automatisierter Handel/Bots sind untersagt) und kann zur Kontosperrung
führen. Deshalb gilt in diesem Projekt bewusst:

- **Der Bot platziert niemals echte Orders bei Trade Republic.**
- Alles, was automatisiert gehandelt wird, läuft über das kostenlose
  Paper-Portfolio.
- Optional lässt sich ein echtes Depot **read-only** einbinden, über das
  quelloffene Community-Projekt [`pytr`](https://github.com/pytr-org/pytr)
  (kein offizielles Trade-Republic-Produkt). Damit lassen sich Kontostand
  und Positionen abgleichen – z. B. um die Positionsgrößen des Bots
  realistisch am eigenen Kapital auszurichten oder Klumpenrisiken zu
  vermeiden.

### Setup (read-only Sync)

```bash
pip install pytr
pytr login   # einmalig interaktiv: Telefonnummer + PIN, Bestätigung per TR-App
```

In `config.yaml`:

```yaml
broker:
  trade_republic:
    enabled: true
    export_command: "pytr export_transactions {output}"
```

Dann:

```bash
python -m trading_bot.cli sync-trade-republic
```

Das Export-Format von `pytr` kann sich je nach Version ändern – der Parser
in `trade_republic_broker.py` ist bewusst tolerant/heuristisch gehalten
(`_parse_export`) und sollte bei Bedarf an die tatsächliche CSV-Struktur
angepasst werden.

**Wer trotzdem automatisiert mit echtem Geld handeln möchte:** Das ist in
diesem Projekt absichtlich nicht vorgesehen. Nutze stattdessen die
Analyse-/Signal-Ausgabe des Bots (`analyze`-Befehl bzw. `decisions.jsonl`)
als Entscheidungsgrundlage und platziere Trades manuell in der
Trade-Republic-App – so bleibt die Kontrolle über jede einzelne
Order beim Menschen.

## Tests

```bash
pip install -r requirements-dev.txt
pytest
```

Die Tests laufen komplett offline mit synthetischen Kursdaten (kein
Netzwerkzugriff nötig) und decken Indikatoren, Scoring-Logik,
Risikomanagement und das Paper-Portfolio ab.

## Grenzen & Hinweise

- Die Analyse ist eine **einfache, transparente Heuristik** – kein
  Machine-Learning-Modell, kein Backtesting über historische Daten
  (Backtesting könnte als nächster Schritt ergänzt werden).
- yfinance liefert kostenlose, teils verzögerte Daten ohne Garantie auf
  Vollständigkeit/Aktualität – für produktiven Einsatz ungeeignet.
- Der Bot trifft weiterhin nur Vorschläge/simulierte Trades; die
  Verantwortung für jede reale Anlageentscheidung liegt beim Menschen.
