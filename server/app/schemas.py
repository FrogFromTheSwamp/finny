"""Схемы запросов и ответов API (Pydantic).

Схема описывает, какой JSON приходит и уходит. FastAPI по ней
проверяет входные данные и рисует документацию в /docs.
"""
import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

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


class ParentMe(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    children: list[LinkedChild]
