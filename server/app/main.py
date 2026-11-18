"""Точка входа сервера Finny.

Пока здесь только проверочные эндпоинты. Документация API
автоматически доступна по адресу http://localhost:8000/docs
"""
from fastapi import FastAPI, HTTPException
from sqlalchemy import text

from app.db import engine
from app.routers import auth, family

app = FastAPI(
    title="Finny API",
    version="0.1.0",
    description="Серверная часть обучающей системы Finny",
)

app.include_router(auth.router)
app.include_router(family.router)


@app.get("/health", tags=["service"])
def health() -> dict:
    """Сервер запущен и отвечает."""
    return {"status": "ok"}


@app.get("/health/db", tags=["service"])
def health_db() -> dict:
    """Сервер может подключиться к PostgreSQL."""
    try:
        with engine.connect() as conn:
            version = conn.execute(text("select version()")).scalar_one()
    except Exception as exc:  # база ещё не поднялась или неверный пароль
        raise HTTPException(status_code=503, detail=f"База недоступна: {exc}")
    return {"database": "ok", "version": version}
