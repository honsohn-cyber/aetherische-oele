"""Kommandozeilen-Interface für den Trading-Bot.

Beispiele:
    python -m trading_bot.cli analyze --symbol AAPL
    python -m trading_bot.cli run --once
    python -m trading_bot.cli run --interval 30
    python -m trading_bot.cli portfolio
    python -m trading_bot.cli reset-portfolio
    python -m trading_bot.cli sync-trade-republic
"""
from __future__ import annotations

import argparse
import os
import sys

from .broker.trade_republic_broker import TradeRepublicReadOnlyBroker, TradeRepublicUnavailableError
from .config import load_config
from .data_provider import DataProviderError
from .engine import TradingBot

try:
    from tabulate import tabulate
except ImportError:  # pragma: no cover - optionale Formatierungshilfe
    tabulate = None


def _print_table(rows: list[dict], headers: list[str]) -> None:
    if not rows:
        print("(keine Daten)")
        return
    table = [[row.get(h, "") for h in headers] for row in rows]
    if tabulate:
        print(tabulate(table, headers=headers, floatfmt=".2f"))
    else:
        print("\t".join(headers))
        for row in table:
            print("\t".join(str(v) for v in row))


def cmd_analyze(args: argparse.Namespace) -> int:
    bot = TradingBot(config_path=args.config)
    symbols = [args.symbol] if args.symbol else bot.watchlist
    if not symbols:
        print("Keine Symbole angegeben und Watchlist in der Config ist leer.")
        return 1
    for symbol in symbols:
        try:
            result = bot.analyze_symbol(symbol)
        except DataProviderError as exc:
            print(f"[{symbol}] Fehler: {exc}")
            continue
        print(result.report())
        print()
    return 0


def cmd_run(args: argparse.Namespace) -> int:
    bot = TradingBot(config_path=args.config)
    interval = None if args.once else args.interval
    iterations = 1 if args.once else args.iterations
    bot.run(interval_minutes=interval, iterations=iterations)
    return 0


def cmd_portfolio(args: argparse.Namespace) -> int:
    bot = TradingBot(config_path=args.config)
    summary = bot.portfolio_summary()
    print(f"Kasse:          {summary['cash']:.2f}")
    print(f"Depotwert:      {summary['equity']:.2f}")
    print(f"Startkapital:   {summary['starting_cash']:.2f}")
    print(f"Gesamt-P&L:     {summary['total_pnl']:+.2f} ({summary['total_pnl_pct']:+.2%})")
    print(f"Anzahl Trades:  {summary['num_trades']}")
    print()
    _print_table(
        summary["positions"],
        ["symbol", "qty", "avg_price", "price", "market_value", "unrealized_pnl", "unrealized_pnl_pct"],
    )
    return 0


def cmd_reset_portfolio(args: argparse.Namespace) -> int:
    bot = TradingBot(config_path=args.config)
    bot.portfolio.reset()
    print(f"Paper-Portfolio zurückgesetzt auf Startkapital {bot.portfolio.starting_cash:.2f}.")
    return 0


def cmd_sync_trade_republic(args: argparse.Namespace) -> int:
    config = load_config(args.config)
    tr_cfg = config["broker"]["trade_republic"]
    if not tr_cfg.get("enabled"):
        print(
            "Trade-Republic-Anbindung ist deaktiviert. Setze "
            "`broker.trade_republic.enabled: true` in config.yaml, um den "
            "read-only Depot-Abgleich zu nutzen (siehe README)."
        )
        return 1

    output_path = os.path.join(config["state"]["data_dir"], "trade_republic_export.csv")
    try:
        tr_broker = TradeRepublicReadOnlyBroker.sync(tr_cfg["export_command"], output_path)
    except TradeRepublicUnavailableError as exc:
        print(f"Sync fehlgeschlagen: {exc}")
        return 1

    print("Echtes Trade-Republic-Depot (read-only, KEINE automatisierten Orders):")
    print(f"  Verrechnungskonto: {tr_broker.get_cash():.2f}")
    print("  Positionen:")
    for symbol, pos in tr_broker.get_positions().items():
        print(f"    {symbol}: {pos['qty']} Stück @ Ø {pos['avg_price']:.2f}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="trading_bot", description="Aktien-Analyse- und Paper-Trading-Bot")
    parser.add_argument("--config", default="config.yaml", help="Pfad zur config.yaml (Standard: config.yaml)")
    subparsers = parser.add_subparsers(dest="command", required=True)

    p_analyze = subparsers.add_parser("analyze", help="Analysiert ein Symbol oder die gesamte Watchlist (ohne zu handeln)")
    p_analyze.add_argument("--symbol", help="Einzelnes Ticker-Symbol (sonst gesamte Watchlist)")
    p_analyze.set_defaults(func=cmd_analyze)

    p_run = subparsers.add_parser("run", help="Führt einen (oder mehrere) Analyse-/Handelszyklen aus")
    p_run.add_argument("--once", action="store_true", help="Nur ein einzelner Zyklus (Standard)")
    p_run.add_argument("--interval", type=float, default=30.0, help="Minuten zwischen Zyklen bei Dauerbetrieb")
    p_run.add_argument("--iterations", type=int, default=None, help="Anzahl Zyklen bei Dauerbetrieb (Standard: unbegrenzt)")
    p_run.set_defaults(func=cmd_run)

    p_portfolio = subparsers.add_parser("portfolio", help="Zeigt den Stand des kostenlosen Test-Portfolios")
    p_portfolio.set_defaults(func=cmd_portfolio)

    p_reset = subparsers.add_parser("reset-portfolio", help="Setzt das Test-Portfolio auf das Startkapital zurück")
    p_reset.set_defaults(func=cmd_reset_portfolio)

    p_sync = subparsers.add_parser(
        "sync-trade-republic",
        help="Read-only Abgleich mit einem echten Trade-Republic-Depot via `pytr` (keine Order-Ausführung)",
    )
    p_sync.set_defaults(func=cmd_sync_trade_republic)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
