"""Схемы запросов и ответов API (Pydantic).

Схема описывает, какой JSON приходит и уходит. FastAPI по ней
проверяет входные данные и рисует документацию в /docs.
"""
import uuid
from datetime import datetime
from typing import Literal

from pydantic import AwareDatetime, BaseModel, EmailStr, Field

from app.config import ACCESS_TOKEN_TTL_MINUTES


# ---------- Родитель ----------

class ParentRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=80)


class ParentLogin(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = ACCESS_TOKEN_TTL_MINUTES * 60  # секунд


# ---------- Ребёнок ----------

class ChildRegister(BaseModel):
    """Всё необязательное: ребёнок может начать играть сразу."""

    pet_name: str | None = Field(default=None, max_length=40)
    pet_color: str | None = Field(default=None, max_length=20)
    timezone: str = Field(default="Europe/Moscow", max_length=64)
    platform: str | None = Field(default=None, max_length=20)


class ChildRegistered(BaseModel):
    child_id: uuid.UUID
    device_id: uuid.UUID
    # Показывается ОДИН раз: телефон должен сохранить его в защищённом хранилище
    device_token: str
    access_token: str
    token_type: str = "bearer"
    expires_in: int = ACCESS_TOKEN_TTL_MINUTES * 60


class DeviceTokenRequest(BaseModel):
    device_token: str


class AccessToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = ACCESS_TOKEN_TTL_MINUTES * 60


class ChildOut(BaseModel):
    id: uuid.UUID
    pet_name: str | None
    pet_color: str | None
    timezone: str


# ---------- Привязка ----------

class LinkCodeOut(BaseModel):
    code: str
    expires_at: datetime


class LinkRequest(BaseModel):
    code: str = Field(pattern=r"^\d{6}$")
    # Родитель явно соглашается на обработку данных ребёнка (152-ФЗ)
    consent: bool


class LinkedChild(ChildOut):
    linked_at: datetime
    # true — ребёнок уже был в списке этого родителя, новая связь не создавалась
    already_linked: bool = False


class ParentMe(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    children: list[LinkedChild]


# ---------- Синхронизация обучения ----------

class SessionIn(BaseModel):
    """Прохождение урока или тренировочного набора (id создаёт телефон)."""

    id: uuid.UUID
    kind: Literal["lesson", "practice", "assessment"]
    lesson_id: str | None = Field(default=None, max_length=40)
    recommendation_id: uuid.UUID | None = None
    status: Literal["started", "completed", "abandoned"] = "started"
    # AwareDatetime: время обязательно с часовым поясом, иначе 422
    started_at: AwareDatetime
    finished_at: AwareDatetime | None = None


class EventIn(BaseModel):
    """Один ответ ребёнка на одно задание.

    Поля is_correct здесь нет намеренно: правильность считает сервер.
    """

    id: uuid.UUID
    session_id: uuid.UUID | None = None
    task_id: str = Field(max_length=80)
    task_version: int = Field(ge=1)
    attempt_no: int = Field(default=1, ge=1)
    answer: dict
    hint_used: bool = False
    duration_ms: int | None = Field(default=None, ge=0)
    device_seq: int | None = Field(default=None, ge=0)
    occurred_at: AwareDatetime


class LearningSyncIn(BaseModel):
    sessions: list[SessionIn] = Field(default_factory=list, max_length=100)
    events: list[EventIn] = Field(default_factory=list, max_length=500)


class ItemResult(BaseModel):
    """Что сервер сделал с каждым присланным объектом.

    accepted  — сохранён впервые;
    duplicate — уже был сохранён раньше (повторная отправка), это не ошибка;
    rejected  — не принят, причина в reason. Повторно слать бесполезно.
    """

    id: uuid.UUID
    status: Literal["accepted", "duplicate", "rejected"]
    is_correct: bool | None = None
    reason: str | None = None


class SyncWarning(BaseModel):
    code: Literal["duplicate_first_attempt", "mastery_rebuild_failed"]
    event_id: uuid.UUID | None = None


class LearningSyncOut(BaseModel):
    sessions: list[ItemResult]
    events: list[ItemResult]
    warnings: list[SyncWarning] = Field(default_factory=list)
