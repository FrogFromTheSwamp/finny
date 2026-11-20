"""Точка входа сервера Finny.

Пока здесь только проверочные эндпоинты. Документация API
автоматически доступна по адресу http://localhost:8000/docs
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import CORS_ORIGINS
from app.db import engine
from app.routers import auth, family, sync

app = FastAPI(
    title="Finny API",
    version="0.1.0",
    description="Серверная часть обучающей системы Finny",
)

# Токен передаётся в заголовке Authorization, а не в cookies,
# поэтому allow_credentials не нужен и "*" безопасно для разработки
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(family.router)
app.include_router(sync.router)


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
