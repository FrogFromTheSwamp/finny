"""Подключение к базе данных PostgreSQL.

Адрес базы берётся из переменной окружения DATABASE_URL,
которую задаёт docker-compose.yml.
"""
import os

from sqlalchemy import create_engine

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+psycopg://finny:finny@localhost:5432/finny",
)

# pool_pre_ping: перед запросом проверять, что соединение живо
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
