"""Пароли и токены.

Два вида токенов:
- access token — JWT, живёт 30 минут, отправляется с каждым запросом
  в заголовке Authorization: Bearer <токен>. Сервер проверяет подпись
  и не ходит в базу, чтобы понять, кто пришёл.
- непрозрачные токены (refresh родителя, токен устройства ребёнка) —
  длинная случайная строка. В базе хранится только её SHA-256 хеш:
  если базу украдут, токенами воспользоваться не смогут.
"""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Literal

import jwt
from pwdlib import PasswordHash

from app.config import ACCESS_TOKEN_TTL_MINUTES, JWT_ALGORITHM, SECRET_KEY

Role = Literal["parent", "child"]

_password_hash = PasswordHash.recommended()  # Argon2 — современный стандарт
# Хеш-«пустышка»: проверяем пароль даже для несуществующей почты,
# чтобы по времени ответа нельзя было узнать, зарегистрирована ли она
_DUMMY_HASH = _password_hash.hash("dummy-password-for-timing")


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def hash_password(password: str) -> str:
    return _password_hash.hash(password)


def verify_password(password: str, password_hash: str | None) -> bool:
    if password_hash is None:
        _password_hash.verify(password, _DUMMY_HASH)
        return False
    return _password_hash.verify(password, password_hash)


def create_access_token(subject: str, role: Role, **extra: str) -> str:
    issued = now_utc()
    payload = {
        "sub": subject,  # кто: id родителя или ребёнка
        "role": role,
        "iat": issued,
        "exp": issued + timedelta(minutes=ACCESS_TOKEN_TTL_MINUTES),
        **extra,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Проверить подпись и срок. Бросает jwt.InvalidTokenError при проблеме."""
    return jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])


def new_opaque_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def new_link_code() -> str:
    """6 цифр, криптографически случайные."""
    return f"{secrets.randbelow(1_000_000):06d}"
