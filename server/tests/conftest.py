"""Общая подготовка для тестов.

Тесты работают с ОТДЕЛЬНОЙ базой finny_test, чтобы не трогать данные
разработки. Перед запуском база пересоздаётся миграциями Alembic —
заодно это проверяет, что миграции применяются с нуля без ошибок.
После каждого теста все таблицы очищаются: тесты не зависят друг от друга.

Запуск: docker compose exec api pytest
"""
import os
from pathlib import Path

from sqlalchemy import create_engine, text

# Подменяем адрес базы ДО импорта приложения: app.db читает его при импорте
BASE_URL = os.environ["DATABASE_URL"]
TEST_DB_NAME = "finny_test"
TEST_URL = BASE_URL.rsplit("/", 1)[0] + "/" + TEST_DB_NAME
os.environ["DATABASE_URL"] = TEST_URL

import pytest  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.db import engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Base  # noqa: E402
from app.routers import family  # noqa: E402

SERVER_DIR = Path(__file__).resolve().parent.parent


def _ensure_test_database() -> None:
    admin = create_engine(BASE_URL, isolation_level="AUTOCOMMIT")
    with admin.connect() as conn:
        exists = conn.scalar(
            text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": TEST_DB_NAME}
        )
        if not exists:
            conn.execute(text(f"CREATE DATABASE {TEST_DB_NAME}"))
    admin.dispose()


@pytest.fixture(scope="session", autouse=True)
def test_database():
    """Один раз за запуск: создать чистую тестовую базу и применить миграции."""
    _ensure_test_database()
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
    cfg = Config(str(SERVER_DIR / "alembic.ini"))
    cfg.set_main_option("script_location", str(SERVER_DIR / "migrations"))
    command.upgrade(cfg, "head")
    yield
    engine.dispose()


@pytest.fixture(autouse=True)
def clean_tables():
    """После каждого теста: очистить все таблицы и счётчик неудачных попыток."""
    yield
    tables = ", ".join(t.name for t in Base.metadata.sorted_tables)
    with engine.begin() as conn:
        conn.execute(text(f"TRUNCATE {tables} RESTART IDENTITY CASCADE"))
    family._failed_attempts.clear()


@pytest.fixture
def client() -> TestClient:
    """«Ненастоящий браузер»: отправляет запросы прямо в приложение."""
    return TestClient(app)
