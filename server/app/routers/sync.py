"""Синхронизация обучения: телефон присылает сессии уроков и ответы ребёнка.

Принципы (offline-first):
- id объектов создаёт телефон, поэтому повторная отправка той же пачки
  безопасна: уже сохранённое помечается как duplicate, а не дублируется;
- правильность ответов считает сервер (app/grading.py);
- каждый объект обрабатывается отдельно: плохой ответ не мешает
  сохранить хорошие из той же пачки.
"""
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.deps import CurrentChildAuth, DbSession
from app.grading import GradingError, grade
from app.models import LearningEvent, Lesson, LessonSession, Recommendation, Task
from app.schemas import EventIn, ItemResult, LearningSyncIn, LearningSyncOut, SessionIn
from app.security import now_utc

router = APIRouter(prefix="/sync", tags=["sync"])

# Часы телефона могут спешить. Время из будущего дальше этого запаса
# заменяем на время сервера (порядок событий всё равно сохраняется в device_seq).
MAX_CLOCK_SKEW = timedelta(minutes=5)
FINAL_STATUSES = {"completed", "abandoned"}


def _clamp(moment: datetime, now: datetime) -> datetime:
    return now if moment > now + MAX_CLOCK_SKEW else moment


def _rejected(item_id: uuid.UUID, reason: str) -> ItemResult:
    return ItemResult(id=item_id, status="rejected", reason=reason)


def _upsert_session(
    db: DbSession, child_id: uuid.UUID, device_id: uuid.UUID, s: SessionIn, now: datetime
) -> ItemResult:
    if s.lesson_id is not None and db.get(Lesson, s.lesson_id) is None:
        return _rejected(s.id, f"неизвестный урок {s.lesson_id}")
    if s.recommendation_id is not None:
        recommendation = db.get(Recommendation, s.recommendation_id)
        if recommendation is None or recommendation.child_id != child_id:
            return _rejected(s.id, "неизвестная рекомендация")

    existing = db.get(LessonSession, s.id)
    if existing is None:
        db.add(
            LessonSession(
                id=s.id,
                child_id=child_id,
                device_id=device_id,
                kind=s.kind,
                lesson_id=s.lesson_id,
                recommendation_id=s.recommendation_id,
                status=s.status,
                started_at=_clamp(s.started_at, now),
                finished_at=_clamp(s.finished_at, now) if s.finished_at else None,
            )
        )
        db.flush()
        return ItemResult(id=s.id, status="accepted")

    if existing.child_id != child_id:
        return _rejected(s.id, "сессия принадлежит другому профилю")
    # Сессию можно только завершить; завершённую обратно не «открыть»
    if existing.status == "started" and s.status in FINAL_STATUSES:
        existing.status = s.status
        existing.finished_at = _clamp(s.finished_at or now, now)
        return ItemResult(id=s.id, status="accepted")
    return ItemResult(id=s.id, status="duplicate")


def _store_events(
    db: DbSession, child_id: uuid.UUID, device_id: uuid.UUID, events: list[EventIn], now: datetime
) -> list[ItemResult]:
    if not events:
        return []

    # Задания и сессии загружаем одним запросом на всю пачку, а не по одному
    tasks = {
        (task.id, task.version): task
        for task in db.scalars(select(Task).where(Task.id.in_({e.task_id for e in events})))
    }
    session_ids = {e.session_id for e in events if e.session_id is not None}
    own_sessions = (
        set(
            db.scalars(
                select(LessonSession.id).where(
                    LessonSession.id.in_(session_ids), LessonSession.child_id == child_id
                )
            )
        )
        if session_ids
        else set()
    )

    results: dict[uuid.UUID, ItemResult] = {}
    rows: list[dict] = []
    for e in events:
        if e.id in results:  # тот же id дважды в одной пачке
            continue
        task = tasks.get((e.task_id, e.task_version))
        if task is None:
            results[e.id] = _rejected(e.id, f"неизвестное задание {e.task_id} v{e.task_version}")
            continue
        if e.session_id is not None and e.session_id not in own_sessions:
            results[e.id] = _rejected(e.id, "сессия не найдена")
            continue
        try:
            is_correct = grade(task.scenario, e.answer)
        except GradingError as exc:
            results[e.id] = _rejected(e.id, f"ответ не подходит к заданию: {exc}")
            continue

        rows.append(
            {
                "id": e.id,
                "child_id": child_id,
                "session_id": e.session_id,
                "device_id": device_id,
                "device_seq": e.device_seq,
                "task_id": e.task_id,
                "task_version": e.task_version,
                "attempt_no": e.attempt_no,
                "answer": e.answer,
                "is_correct": is_correct,
                "hint_used": e.hint_used,
                "duration_ms": e.duration_ms,
                "occurred_at": _clamp(e.occurred_at, now),
            }
        )
        results[e.id] = ItemResult(id=e.id, status="accepted", is_correct=is_correct)

    if rows:
        # INSERT ... ON CONFLICT DO NOTHING RETURNING id:
        # вернутся только реально вставленные; остальные уже были в базе
        inserted = set(
            db.scalars(
                insert(LearningEvent)
                .values(rows)
                .on_conflict_do_nothing(index_elements=["id"])
                .returning(LearningEvent.id)
            )
        )
        already_stored = {row["id"] for row in rows} - inserted
        if already_stored:
            stored = db.execute(
                select(LearningEvent.id, LearningEvent.child_id, LearningEvent.is_correct).where(
                    LearningEvent.id.in_(already_stored)
                )
            ).all()
            for event_id, owner_id, stored_correct in stored:
                if owner_id != child_id:
                    results[event_id] = _rejected(event_id, "id события уже занят")
                else:
                    results[event_id] = ItemResult(
                        id=event_id, status="duplicate", is_correct=stored_correct
                    )

    # Неделя 4: здесь же будет пересчёт оценок освоения (BKT) по новым ответам
    return [results[e.id] for e in events]


@router.post("/learning", response_model=LearningSyncOut)
def sync_learning(body: LearningSyncIn, auth: CurrentChildAuth, db: DbSession) -> LearningSyncOut:
    """Принять пачку сессий и ответов ребёнка.

    Сначала обрабатываются сессии (ответы могут ссылаться на сессию
    из той же пачки), затем ответы. В ответе — статус каждого объекта:
    accepted и duplicate телефон может удалить из своей очереди,
    rejected — тоже удалить, повторять бесполезно.
    """
    now = now_utc()
    child_id, device_id = auth.child.id, auth.device.id

    session_results = [_upsert_session(db, child_id, device_id, s, now) for s in body.sessions]
    event_results = _store_events(db, child_id, device_id, body.events, now)

    auth.device.last_sync_at = now
    db.commit()
    return LearningSyncOut(sessions=session_results, events=event_results)
