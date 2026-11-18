"""Зависимости FastAPI: «кто делает запрос».

Функцию-зависимость указывают в параметрах эндпоинта, и FastAPI
вызывает её перед эндпоинтом. Если токена нет или он плохой,
зависимость отвечает 401, и до эндпоинта дело не доходит.
"""
import uuid
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Child, User
from app.security import decode_access_token

DbSession = Annotated[Session, Depends(get_db)]

# Кнопка Authorize в /docs: туда вставляется access_token
_bearer = HTTPBearer(auto_error=False)


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def _claims(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> dict:
    if creds is None:
        raise _unauthorized("Нужен токен авторизации")
    try:
        return decode_access_token(creds.credentials)
    except jwt.ExpiredSignatureError:
        raise _unauthorized("Токен истёк, обнови его")
    except jwt.InvalidTokenError:
        raise _unauthorized("Неверный токен")


def get_current_parent(claims: Annotated[dict, Depends(_claims)], db: DbSession) -> User:
    if claims.get("role") != "parent":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Доступно только родителю")
    user = db.get(User, uuid.UUID(claims["sub"]))
    if user is None or user.deleted_at is not None:
        raise _unauthorized("Пользователь не найден")
    return user


def get_current_child(claims: Annotated[dict, Depends(_claims)], db: DbSession) -> Child:
    if claims.get("role") != "child":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Доступно только ребёнку")
    child = db.get(Child, uuid.UUID(claims["sub"]))
    if child is None or child.deleted_at is not None:
        raise _unauthorized("Профиль не найден")
    return child


CurrentParent = Annotated[User, Depends(get_current_parent)]
CurrentChild = Annotated[Child, Depends(get_current_child)]
