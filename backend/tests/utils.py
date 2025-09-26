from __future__ import annotations

from sqlalchemy import MetaData, text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID as PG_UUID
from sqlalchemy.ext.compiler import compiles


@compiles(JSONB, 'sqlite')
def _compile_jsonb(_element, _compiler, **_kw):
    return 'JSON'


@compiles(ARRAY, 'sqlite')
def _compile_array(_element, _compiler, **_kw):
    return 'TEXT'


@compiles(PG_UUID, 'sqlite')
def _compile_uuid(_element, _compiler, **_kw):
    return 'CHAR(36)'


def strip_postgres_casts(metadata: MetaData) -> None:
    """Remove Postgres-specific cast syntax from server defaults for SQLite."""
    for table in metadata.tables.values():
        for column in table.columns:
            default = column.server_default
            if default is None:
                continue
            raw = getattr(default, 'arg', default)
            raw_text = str(raw).strip()
            if not raw_text:
                column.server_default = None
                continue
            if raw_text.startswith('(') and raw_text.endswith(')'):
                raw_text = raw_text[1:-1].strip()
            if '::' in raw_text:
                raw_text = raw_text.split('::', 1)[0].strip()
            if not raw_text:
                column.server_default = None
            else:
                column.server_default = text(raw_text)


__all__ = ['strip_postgres_casts']
