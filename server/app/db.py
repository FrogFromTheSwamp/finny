"""Подключение к базе данных PostgreSQL.

Адрес базы берётся из переменной окружения DATABASE_URL,
которую задаёт docker-compose.yml.
"""
import os
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+psycopg://finny:finny@localhost:5432/finny",
)

# pool_pre_ping: перед запросом проверять, что соединение живо
engine = create_engine(DATABASE_URL, pool_pre_ping=True)


# Фабрика сессий. Сессия — «разговор» с базой на время одного запроса.
SessionLocal = sessionmaker(engine, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """Зависимость FastAPI: открыть сессию на запрос и закрыть после."""
    with SessionLocal() as session:
        yield session
