"""Синхронизация обучения: телефон присылает сессии уроков и ответы ребёнка.

Принципы (offline-first):
- id объектов создаёт телефон, поэтому повторная отправка той же пачки
  безопасна: уже сохранённое помечается как duplicate, а не дублируется;
- правильность ответов считает сервер (app/grading.py);
- каждый объект обрабатывается отдельно: плохой ответ не мешает
  сохранить хорошие из той же пачки.
"""
import logging
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter
from sqlalchemy import func, select, tuple_
from sqlalchemy.dialects.postgresql import insert

from app.deps import CurrentChildAuth, DbSession
from app.grading import GradingError, grade
from app.models import Child, LearningEvent, Lesson, LessonSession, Recommendation, Task
from app.rebuild_mastery import rebuild_child
from app.schemas import EventIn, ItemResult, LearningSyncIn, LearningSyncOut, SessionIn, SyncWarning
from app.security import now_utc

router = APIRouter(prefix="/sync", tags=["sync"])
logger = logging.getLogger(__name__)

# Допуск для опережающих часов телефона.
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


def _stored_results(db: DbSession, child_id: uuid.UUID, ids: set[uuid.UUID]) -> dict[uuid.UUID, ItemResult]:
    """Вернуть исходную оценку для уже доставленных UUID этого ребёнка."""
    stored = db.execute(select(LearningEvent.id, LearningEvent.child_id, LearningEvent.is_correct)
                        .where(LearningEvent.id.in_(ids)))
    return {event_id: (ItemResult(id=event_id, status="duplicate", is_correct=correct)
                       if owner == child_id else _rejected(event_id, "id события уже занят"))
            for event_id, owner, correct in stored}


def _prepare_event_times(db: DbSession, child_id: uuid.UUID, rows: list[dict],
                         now: datetime) -> set[tuple[uuid.UUID, str]]:
    """Сохранить интервалы нажатий и закрепить порядок приёма дублей первой попытки."""
    latest = max(row["occurred_at"] for row in rows)
    offset = latest - now if latest - now > MAX_CLOCK_SKEW else timedelta()
    keys = {(row["session_id"], row["task_id"]) for row in rows
            if row["session_id"] is not None and row["attempt_no"] == 1}
    last_receipt = {}
    if keys:
        event = LearningEvent
        receipts = db.execute(select(event.session_id, event.task_id, func.max(event.received_at))
                              .where(event.child_id == child_id, event.attempt_no == 1,
                                     event.is_correct.is_not(None), tuple_(event.session_id, event.task_id).in_(keys))
                              .group_by(event.session_id, event.task_id))
        last_receipt = {(session_id, task): received for session_id, task, received in receipts}
    already_seen = set(last_receipt)
    for row in rows:
        row["occurred_at"] -= offset
        row["received_at"] = now
        if row["session_id"] is not None and row["attempt_no"] == 1:
            key = (row["session_id"], row["task_id"])
            # При совпадении времени второй UUID не вытеснит первый даже с меньшим device_seq.
            if key in last_receipt:
                row["received_at"] = max(now, last_receipt[key] + timedelta(microseconds=1))
            last_receipt[key] = row["received_at"]
    return already_seen


def _store_events(
    db: DbSession, child_id: uuid.UUID, device_id: uuid.UUID, events: list[EventIn], now: datetime
) -> tuple[list[ItemResult], set[str], list[SyncWarning]]:
    if not events:
        return [], set(), []

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

    # Уже доставленные UUID не участвуют в оценке сдвига часов новой пачки.
    results = _stored_results(db, child_id, {e.id for e in events})
    rows: list[dict] = []
    for e in events:
        if e.id in results:
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
                "occurred_at": e.occurred_at,
            }
        )
        results[e.id] = ItemResult(id=e.id, status="accepted", is_correct=is_correct)

    skills: set[str] = set()
    warnings: list[SyncWarning] = []
    if rows:
        seen = _prepare_event_times(db, child_id, rows, now)
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
        for row in rows:
            if row["id"] not in inserted or row["attempt_no"] != 1 or row["session_id"] is None:
                continue
            key = (row["session_id"], row["task_id"])
            if key in seen:
                warnings.append(SyncWarning(code="duplicate_first_attempt", event_id=row["id"]))
            else:
                seen.add(key)
                skills.add(tasks[(row["task_id"], row["task_version"])].competency_id)
        already_stored = {row["id"] for row in rows} - inserted
        if already_stored:
            results.update(_stored_results(db, child_id, already_stored))

    ordered = []
    for event in events:
        result = results[event.id]
        ordered.append(result)
        if result.status == "accepted":
            results[event.id] = ItemResult(id=event.id, status="duplicate", is_correct=result.is_correct)
    return ordered, skills, warnings


@router.post("/learning", response_model=LearningSyncOut)
def sync_learning(body: LearningSyncIn, auth: CurrentChildAuth, db: DbSession) -> LearningSyncOut:
    """Принять пачку сессий и ответов ребёнка.

    Сначала обрабатываются сессии (ответы могут ссылаться на сессию
    из той же пачки), затем ответы. В ответе — статус каждого объекта:
    accepted и duplicate телефон может удалить из своей очереди,
    rejected — тоже удалить, повторять бесполезно.
    """
    child_id, device_id = auth.child.id, auth.device.id
    db.execute(select(Child.id).where(Child.id == child_id).with_for_update()).scalar_one()
    now = now_utc()

    session_results = [_upsert_session(db, child_id, device_id, s, now) for s in body.sessions]
    event_results, skills, warnings = _store_events(db, child_id, device_id, body.events, now)
    if skills:
        try:
            with db.begin_nested():
                rebuild_child(db, child_id, skills)
        except Exception:
            # Журнал остаётся во внешней транзакции. Кэш восстановит rebuild_mastery.
            logger.exception("Сбой пересчёта mastery для ребёнка %s, навыки %s", child_id, sorted(skills))
            warnings.append(SyncWarning(code="mastery_rebuild_failed"))

    auth.device.last_sync_at = now
    db.commit()
    return LearningSyncOut(sessions=session_results, events=event_results, warnings=warnings)
