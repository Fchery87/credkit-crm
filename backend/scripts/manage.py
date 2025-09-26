"""Lightweight management commands for migrations and demo data."""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Optional

from alembic import command
from alembic.config import Config

PROJECT_ROOT = Path(__file__).resolve().parents[1]
ALEMBIC_INI = PROJECT_ROOT / "alembic.ini"
ALEMBIC_SCRIPT_LOCATION = PROJECT_ROOT / "alembic"


def _create_config(database_url: Optional[str]) -> Config:
    if not ALEMBIC_INI.exists():
        raise FileNotFoundError(f"Expected Alembic config at {ALEMBIC_INI}")

    cfg = Config(str(ALEMBIC_INI))
    cfg.set_main_option("script_location", str(ALEMBIC_SCRIPT_LOCATION))

    if database_url:
        cfg.set_main_option("sqlalchemy.url", database_url)

    return cfg


def migrate(revision: str, sql: bool = False) -> None:
    """Apply Alembic migrations up to the requested revision."""
    database_url = os.getenv("DATABASE_URL")
    cfg = _create_config(database_url)
    command.upgrade(cfg, revision, sql=sql)


def downgrade(revision: str) -> None:
    """Rollback Alembic migrations down to the requested revision."""
    database_url = os.getenv("DATABASE_URL")
    cfg = _create_config(database_url)
    command.downgrade(cfg, revision)


def seed_demo(force: bool = False) -> None:
    """Seed the demo tenant, users, and supporting records."""
    from app.seed_data import clear_seed_data, create_seed_data

    if force:
        clear_seed_data()
    create_seed_data()


def bootstrap_demo(force: bool = False) -> None:
    """Seed demo data and ensure a sample credit report snapshot exists."""
    from . import bootstrap_demo as bootstrap_module

    bootstrap_module.main(force=force)


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="CredKit management helper")
    subparsers = parser.add_subparsers(dest="command", required=True)

    migrate_parser = subparsers.add_parser("migrate", help="Run Alembic upgrade")
    migrate_parser.add_argument(
        "--revision",
        default="head",
        help="Revision to upgrade to (default: head)",
    )
    migrate_parser.add_argument(
        "--sql",
        action="store_true",
        help="Generate SQL without applying it",
    )

    downgrade_parser = subparsers.add_parser("downgrade", help="Run Alembic downgrade")
    downgrade_parser.add_argument(
        "revision",
        help="Revision identifier to downgrade to (e.g. -1 or base)",
    )

    seed_parser = subparsers.add_parser("seed-demo", help="Populate the demo tenant data")
    seed_parser.add_argument(
        "--force",
        action="store_true",
        help="Clear existing demo data before seeding",
    )

    bootstrap_parser = subparsers.add_parser(
        "bootstrap-demo",
        help="Ensure demo seed data and a sample credit report snapshot",
    )
    bootstrap_parser.add_argument(
        "--force",
        action="store_true",
        help="Recreate demo data before bootstrapping",
    )

    return parser


def main(argv: Optional[list[str]] = None) -> None:
    parser = _build_parser()
    args = parser.parse_args(argv)

    if args.command == "migrate":
        migrate(args.revision, sql=args.sql)
        return

    if args.command == "downgrade":
        downgrade(args.revision)
        return

    if args.command == "seed-demo":
        seed_demo(force=args.force)
        return

    if args.command == "bootstrap-demo":
        bootstrap_demo(force=args.force)
        return

    parser.print_help()


if __name__ == "__main__":
    main(sys.argv[1:])

