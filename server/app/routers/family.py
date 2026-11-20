"""Профили и привязка «ребёнок — родитель» по коду."""
from collections import defaultdict, deque
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, update

from app.config import (
    LINK_CODE_TTL_MINUTES,
    LINK_FAILED_WINDOW_MINUTES,
    LINK_MAX_FAILED_ATTEMPTS,
)
from app.deps import CurrentChild, CurrentParent, DbSession
from app.models import Child, FamilyLink, LinkCode
from app.schemas import ChildOut, LinkCodeOut, LinkedChild, LinkRequest, ParentMe
from app.security import new_link_code, now_utc

router = APIRouter(tags=["family"])

# Защита от перебора кодов: время неудачных попыток каждого родителя.
# Хранится в памяти процесса — для MVP с одним сервером достаточно
# (ограничение: при перезапуске сервера счётчик обнуляется).
_failed_attempts: dict[str, deque[datetime]] = defaultdict(deque)


def _too_many_failures(parent_id: str) -> bool:
    window_start = now_utc() - timedelta(minutes=LINK_FAILED_WINDOW_MINUTES)
    attempts = _failed_attempts[parent_id]
    while attempts and attempts[0] < window_start:
        attempts.popleft()
    return len(attempts) >= LINK_MAX_FAILED_ATTEMPTS


def _child_out(child: Child) -> ChildOut:
    return ChildOut(
        id=child.id, pet_name=child.pet_name, pet_color=child.pet_color, timezone=child.timezone
    )


# ---------- Ребёнок ----------

@router.get("/children/me", response_model=ChildOut)
def child_me(child: CurrentChild) -> ChildOut:
    return _child_out(child)


@router.post("/children/me/link-code", response_model=LinkCodeOut, status_code=201)
def create_link_code(child: CurrentChild, db: DbSession) -> LinkCodeOut:
    """Ребёнок нажал «Пригласить родителя»: выдать новый одноразовый код.

    Старые неиспользованные коды этого ребёнка сразу перестают работать.
    """
    now = now_utc()
    db.execute(
        update(LinkCode)
        .where(LinkCode.child_id == child.id, LinkCode.used_at.is_(None), LinkCode.expires_at > now)
        .values(expires_at=now)
    )

    # Код должен быть уникальным среди действующих кодов всех детей
    for _ in range(20):
        code = new_link_code()
        taken = db.scalar(
            select(LinkCode.id).where(
                LinkCode.code == code, LinkCode.used_at.is_(None), LinkCode.expires_at > now
            )
        )
        if taken is None:
            break
    else:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Не удалось создать код, попробуй ещё раз")

    link_code = LinkCode(
        code=code, child_id=child.id, expires_at=now + timedelta(minutes=LINK_CODE_TTL_MINUTES)
    )
    db.add(link_code)
    db.commit()
    return LinkCodeOut(code=code, expires_at=link_code.expires_at)


# ---------- Родитель ----------

@router.post("/family/link", response_model=LinkedChild)
def link_child(body: LinkRequest, parent: CurrentParent, db: DbSession) -> LinkedChild:
    """Родитель вводит код с экрана ребёнка и даёт согласие на обработку данных."""
    if not body.consent:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Нужно согласие на обработку данных ребёнка"
        )

    parent_key = str(parent.id)
    if _too_many_failures(parent_key):
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"Слишком много неверных попыток, подожди {LINK_FAILED_WINDOW_MINUTES} минут",
        )

    now = now_utc()
    link_code = db.scalar(
        select(LinkCode).where(
            LinkCode.code == body.code, LinkCode.used_at.is_(None), LinkCode.expires_at > now
        )
    )
    child = db.get(Child, link_code.child_id) if link_code else None
    if link_code is None or child is None or child.deleted_at is not None:
        _failed_attempts[parent_key].append(now)
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Код не найден или истёк")

    link_code.used_at = now
    link = db.get(FamilyLink, (parent.id, child.id))
    already_linked = link is not None and link.revoked_at is None
    if link is None:
        link = FamilyLink(parent_id=parent.id, child_id=child.id, consent_at=now)
        db.add(link)
    elif link.revoked_at is not None:  # связь когда-то отозвали — восстанавливаем
        link.revoked_at = None
        link.consent_at = now
    db.commit()

    return LinkedChild(
        **_child_out(child).model_dump(), linked_at=link.consent_at, already_linked=already_linked
    )


@router.get("/parents/me", response_model=ParentMe)
def parent_me(parent: CurrentParent, db: DbSession) -> ParentMe:
    """Профиль родителя и список привязанных детей."""
    rows = db.execute(
        select(Child, FamilyLink.consent_at)
        .join(FamilyLink, FamilyLink.child_id == Child.id)
        .where(
            FamilyLink.parent_id == parent.id,
            FamilyLink.revoked_at.is_(None),
            Child.deleted_at.is_(None),
        )
        .order_by(FamilyLink.consent_at)
    ).all()
    children = [
        LinkedChild(**_child_out(child).model_dump(), linked_at=linked_at)
        for child, linked_at in rows
    ]
    return ParentMe(id=parent.id, email=parent.email, name=parent.name, children=children)
