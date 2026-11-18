"""Как Alembic подключается к базе и где берёт описание таблиц."""
from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool

from app.db import DATABASE_URL
from app.models import Base  # импорт регистрирует все таблицы

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Описание «как должно быть» — Alembic сравнивает его с тем, что есть в базе
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Режим без подключения: печатает SQL вместо выполнения."""
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Обычный режим: подключается к базе и выполняет миграции."""
    engine = create_engine(DATABASE_URL, poolclass=pool.NullPool)
    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
