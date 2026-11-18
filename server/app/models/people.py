"""Люди и доступ: родители, дети, устройства, семейные связи."""
import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, SoftDeleteMixin, TimestampMixin, new_uuid


class User(TimestampMixin, SoftDeleteMixin, Base):
    """Взрослый аккаунт (родитель). Вход по почте и паролю."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=new_uuid)
    email: Mapped[str] = mapped_column(String(254), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))  # сам пароль не храним никогда
    name: Mapped[str] = mapped_column(String(80))


class Child(TimestampMixin, SoftDeleteMixin, Base):
    """Профиль ребёнка.

    Настоящее имя ребёнка на сервер НЕ передаётся (152-ФЗ): оно остаётся
    на телефоне. Здесь только то, что не идентифицирует человека.
    """

    __tablename__ = "children"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=new_uuid)
    pet_name: Mapped[str | None] = mapped_column(String(40))
    pet_color: Mapped[str | None] = mapped_column(String(20))
    # Нужен, чтобы правильно считать границы недели и «сегодня»
    timezone: Mapped[str] = mapped_column(String(64), default="Europe/Moscow")


class Device(TimestampMixin, Base):
    """Устройство ребёнка. Так ребёнок «входит» без пароля.

    При первом запуске телефон получает токен; на сервере хранится только
    его хеш. Потерян телефон — родитель отзывает устройство (revoked_at).
    """

    __tablename__ = "devices"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=new_uuid)
    child_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("children.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True)
    platform: Mapped[str | None] = mapped_column(String(20))  # android / ios / web
    last_sync_at: Mapped[datetime | None] = mapped_column()
    revoked_at: Mapped[datetime | None] = mapped_column()


class RefreshToken(Base):
    """Долгоживущие токены родителей: нужны для «выйти из аккаунта»."""

    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=new_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column()
    revoked_at: Mapped[datetime | None] = mapped_column()


class FamilyLink(TimestampMixin, Base):
    """Связь «родитель — ребёнок» (многие ко многим).

    consent_at — момент, когда родитель дал согласие на обработку данных.
    """

    __tablename__ = "family_links"

    parent_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    child_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("children.id"), primary_key=True)
    consent_at: Mapped[datetime] = mapped_column()
    revoked_at: Mapped[datetime | None] = mapped_column()


class LinkCode(Base):
    """Одноразовый код привязки, который ребёнок показывает родителю."""

    __tablename__ = "link_codes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=new_uuid)
    code: Mapped[str] = mapped_column(String(12), index=True)
    child_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("children.id"))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column()  # живёт 10–15 минут
    used_at: Mapped[datetime | None] = mapped_column()
    failed_attempts: Mapped[int] = mapped_column(default=0)  # защита от перебора
