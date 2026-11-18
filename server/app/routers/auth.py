"""Регистрация и вход: родитель (почта + пароль) и ребёнок (токен устройства)."""
import uuid
from datetime import timedelta

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select

from app.config import REFRESH_TOKEN_TTL_DAYS
from app.deps import DbSession
from app.models import Child, Device, GameState, RefreshToken, User
from app.schemas import (
    AccessToken,
    ChildRegister,
    ChildRegistered,
    DeviceTokenRequest,
    ParentLogin,
    ParentRegister,
    RefreshRequest,
    TokenPair,
)
from app.security import (
    create_access_token,
    hash_password,
    hash_token,
    new_opaque_token,
    now_utc,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _issue_parent_tokens(db: DbSession, user: User) -> TokenPair:
    """Выдать пару токенов: access (JWT) + refresh (хранится хешем в базе)."""
    refresh = new_opaque_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_token(refresh),
            expires_at=now_utc() + timedelta(days=REFRESH_TOKEN_TTL_DAYS),
        )
    )
    db.commit()
    return TokenPair(
        access_token=create_access_token(str(user.id), "parent"),
        refresh_token=refresh,
    )


# ---------- Родитель ----------

@router.post("/parents/register", response_model=TokenPair, status_code=201)
def register_parent(body: ParentRegister, db: DbSession) -> TokenPair:
    """Регистрация родителя. Сразу возвращает токены, отдельно входить не нужно."""
    email = body.email.lower()
    exists = db.scalar(select(func.count()).select_from(User).where(User.email == email))
    if exists:
        raise HTTPException(status.HTTP_409_CONFLICT, "Эта почта уже зарегистрирована")

    user = User(email=email, password_hash=hash_password(body.password), name=body.name)
    db.add(user)
    db.flush()  # получить user.id до коммита
    return _issue_parent_tokens(db, user)


@router.post("/parents/login", response_model=TokenPair)
def login_parent(body: ParentLogin, db: DbSession) -> TokenPair:
    user = db.scalar(
        select(User).where(User.email == body.email.lower(), User.deleted_at.is_(None))
    )
    # Одинаковая ошибка для «нет такой почты» и «неверный пароль»:
    # не подсказываем, какие почты зарегистрированы
    if not verify_password(body.password, user.password_hash if user else None):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Неверная почта или пароль")
    return _issue_parent_tokens(db, user)


@router.post("/refresh", response_model=TokenPair)
def refresh_parent(body: RefreshRequest, db: DbSession) -> TokenPair:
    """Обменять refresh-токен на новую пару.

    Ротация: старый refresh сразу отзывается. Если его украли и уже
    использовали, повторное использование не сработает.
    """
    token = db.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == hash_token(body.refresh_token))
    )
    if token is None or token.revoked_at is not None or token.expires_at <= now_utc():
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh-токен недействителен")

    user = db.get(User, token.user_id)
    if user is None or user.deleted_at is not None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Пользователь не найден")

    token.revoked_at = now_utc()
    return _issue_parent_tokens(db, user)


@router.post("/logout", status_code=204)
def logout_parent(body: RefreshRequest, db: DbSession) -> None:
    """Выход: отозвать refresh-токен. Access-токен сам истечёт через ≤30 минут."""
    token = db.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == hash_token(body.refresh_token))
    )
    if token is not None and token.revoked_at is None:
        token.revoked_at = now_utc()
        db.commit()


# ---------- Ребёнок ----------

@router.post("/children/register", response_model=ChildRegistered, status_code=201)
def register_child(body: ChildRegister, db: DbSession) -> ChildRegistered:
    """Первый запуск приложения ребёнком: создать профиль, устройство и состояние игры.

    Ни почты, ни настоящего имени: только то, что не идентифицирует ребёнка.
    """
    child = Child(
        id=uuid.uuid4(),
        pet_name=body.pet_name,
        pet_color=body.pet_color,
        timezone=body.timezone,
    )
    device_token = new_opaque_token()
    device = Device(
        id=uuid.uuid4(),
        child_id=child.id,
        token_hash=hash_token(device_token),
        platform=body.platform,
    )
    # Сначала ребёнок, потом то, что на него ссылается. Без явного flush()
    # SQLAlchemy может отправить INSERT в game_states раньше, чем в children,
    # и PostgreSQL отклонит его: ссылка на несуществующего ребёнка.
    db.add(child)
    db.flush()
    db.add_all([device, GameState(child_id=child.id)])
    db.commit()

    return ChildRegistered(
        child_id=child.id,
        device_id=device.id,
        device_token=device_token,
        access_token=create_access_token(str(child.id), "child", device_id=str(device.id)),
    )


@router.post("/children/token", response_model=AccessToken)
def child_token(body: DeviceTokenRequest, db: DbSession) -> AccessToken:
    """Получить новый access-токен ребёнка по токену устройства."""
    device = db.scalar(select(Device).where(Device.token_hash == hash_token(body.device_token)))
    if device is None or device.revoked_at is not None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Устройство не найдено или отключено")
    child = db.get(Child, device.child_id)
    if child is None or child.deleted_at is not None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Профиль не найден")
    return AccessToken(
        access_token=create_access_token(str(child.id), "child", device_id=str(device.id))
    )
