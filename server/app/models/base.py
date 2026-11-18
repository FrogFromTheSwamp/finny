"""Общие детали для всех таблиц.

Base — родительский класс всех моделей. Через него SQLAlchemy узнаёт,
какие таблицы есть в базе (Base.metadata), а Alembic по этому списку
строит миграции.
"""
import uuid
from datetime import datetime
from typing import Iterable

from sqlalchemy import CheckConstraint, DateTime, MetaData, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# Единые правила именования ограничений и индексов.
# Без них PostgreSQL придумывает имена сам, и миграции становятся хрупкими.
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)

    # Как переводить типы Python в типы PostgreSQL по умолчанию
    type_annotation_map = {
        datetime: DateTime(timezone=True),  # всегда храним время с часовым поясом
        dict: JSONB,
        list: JSONB,
    }


class TimestampMixin:
    """created_at / updated_at — когда строка появилась и когда менялась."""

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )


class SoftDeleteMixin:
    """Мягкое удаление: строку не стираем, а помечаем.

    Нужно для синхронизации: если ребёнок удалил цель офлайн,
    сервер узнаёт об этом по заполненному deleted_at.
    """

    deleted_at: Mapped[datetime | None] = mapped_column()


def new_uuid() -> uuid.UUID:
    return uuid.uuid4()


def one_of(column: str, values: Iterable[str]) -> CheckConstraint:
    """Ограничение «значение колонки — только из списка» (аналог enum)."""
    allowed = ", ".join(f"'{v}'" for v in values)
    return CheckConstraint(f"{column} IN ({allowed})", name=f"{column}_allowed")
