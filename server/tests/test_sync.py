"""Тесты синхронизации обучения: сессии и ответы ребёнка."""
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import func, select, update

from app.db import SessionLocal
from app.models import Device, LearningEvent, LessonSession
from app.seed_content import main as seed
from tests.helpers import auth, register_child, register_parent


@pytest.fixture(autouse=True)
def content():
    """Для синхронизации в базе должны быть уроки и задания."""
    seed()


def now_iso(shift: timedelta = timedelta()) -> str:
    return (datetime.now(timezone.utc) + shift).isoformat()


def session(status: str = "started", lesson_id: str = "budget-4", **extra) -> dict:
    return {
        "id": str(uuid.uuid4()),
        "kind": "lesson",
        "lesson_id": lesson_id,
        "status": status,
        "started_at": now_iso(),
        **extra,
    }


def event(task_id: str, answer: dict, session_id: str | None = None, **extra) -> dict:
    return {
        "id": str(uuid.uuid4()),
        "session_id": session_id,
        "task_id": task_id,
        "task_version": 1,
        "answer": answer,
        "occurred_at": now_iso(),
        **extra,
    }


def sync(client, token: str, sessions=(), events=()):
    return client.post(
        "/sync/learning",
        json={"sessions": list(sessions), "events": list(events)},
        headers=auth(token),
    )


def stored_events() -> int:
    with SessionLocal() as db:
        return db.scalar(select(func.count()).select_from(LearningEvent))


# ---------- Основной сценарий ----------

def test_answers_saved_and_graded_by_server(client):
    child = register_child(client)
    s = session()
    # Карточка 3: «Желание и необходимость — одно и то же» — правильный ответ «не согласен»
    right = event("budget-4.swipe.3", {"choice": False}, s["id"])
    # Карточка 1: «Бюджет — это план…» — правильный ответ «согласен»
    wrong = event("budget-4.swipe.1", {"choice": False}, s["id"])

    response = sync(client, child["access_token"], [s], [right, wrong])

    assert response.status_code == 200
    data = response.json()
    assert data["sessions"][0]["status"] == "accepted"
    assert [e["status"] for e in data["events"]] == ["accepted", "accepted"]
    assert [e["is_correct"] for e in data["events"]] == [True, False]
    assert stored_events() == 2


def test_client_cannot_mark_wrong_answer_as_correct(client):
    child = register_child(client)
    wrong = event("budget-4.swipe.1", {"choice": False}, is_correct=True)

    data = sync(client, child["access_token"], events=[wrong]).json()

    assert data["events"][0]["is_correct"] is False


def test_resending_same_batch_creates_no_duplicates(client):
    child = register_child(client)
    s = session()
    e = event("savings-2.weekly", {"value": 10}, s["id"])

    sync(client, child["access_token"], [s], [e])
    second = sync(client, child["access_token"], [s], [e]).json()

    assert second["sessions"][0]["status"] == "duplicate"
    assert second["events"][0] == {
        "id": e["id"], "status": "duplicate", "is_correct": True, "reason": None
    }
    assert stored_events() == 1


def test_same_event_twice_in_one_batch(client):
    child = register_child(client)
    e = event("savings-2.weekly", {"value": 10})

    data = sync(client, child["access_token"], events=[e, e]).json()

    assert len(data["events"]) == 2
    assert stored_events() == 1


# ---------- Отклонённые ответы ----------

def test_unknown_task_or_version_rejected(client):
    child = register_child(client)
    unknown = event("budget-99.magic", {"choice": True})
    old_version = event("savings-2.weekly", {"value": 10}, task_version=7)

    data = sync(client, child["access_token"], events=[unknown, old_version]).json()

    assert [e["status"] for e in data["events"]] == ["rejected", "rejected"]
    assert "неизвестное задание" in data["events"][0]["reason"]
    assert stored_events() == 0


def test_malformed_answer_rejected_but_good_ones_kept(client):
    child = register_child(client)
    bad = event("savings-2.weekly", {"wrong_field": 10})
    good = event("savings-2.weekly", {"value": 10})

    data = sync(client, child["access_token"], events=[bad, good]).json()

    assert [e["status"] for e in data["events"]] == ["rejected", "accepted"]
    assert stored_events() == 1


def test_cannot_use_another_childs_session(client):
    first = register_child(client, pet_name="Первый")
    second = register_child(client, pet_name="Второй")
    s = session()
    sync(client, first["access_token"], [s])

    e = event("savings-2.weekly", {"value": 10}, s["id"])
    data = sync(client, second["access_token"], events=[e]).json()

    assert data["events"][0]["status"] == "rejected"


def test_unknown_lesson_in_session_rejected(client):
    child = register_child(client)
    data = sync(client, child["access_token"], [session(lesson_id="no-such-lesson")]).json()
    assert data["sessions"][0]["status"] == "rejected"


# ---------- Сессии ----------

def test_session_can_be_completed_but_not_reopened(client):
    child = register_child(client)
    s = session()
    sync(client, child["access_token"], [s])

    completed = {**s, "status": "completed", "finished_at": now_iso()}
    assert sync(client, child["access_token"], [completed]).json()["sessions"][0]["status"] == "accepted"

    reopened = {**s, "status": "started"}
    assert sync(client, child["access_token"], [reopened]).json()["sessions"][0]["status"] == "duplicate"

    with SessionLocal() as db:
        assert db.get(LessonSession, uuid.UUID(s["id"])).status == "completed"


# ---------- Время ----------

def test_time_from_future_is_clamped(client):
    child = register_child(client)
    e = event("savings-2.weekly", {"value": 10}, occurred_at=now_iso(timedelta(days=3)))

    sync(client, child["access_token"], events=[e])

    with SessionLocal() as db:
        stored = db.get(LearningEvent, uuid.UUID(e["id"]))
    assert stored.occurred_at < datetime.now(timezone.utc) + timedelta(minutes=10)


def test_time_without_timezone_rejected(client):
    child = register_child(client)
    e = event("savings-2.weekly", {"value": 10}, occurred_at="2026-11-20T10:00:00")
    assert sync(client, child["access_token"], events=[e]).status_code == 422


# ---------- Доступ ----------

def test_parent_cannot_sync_learning(client):
    parent = register_parent(client)
    assert sync(client, parent["access_token"]).status_code == 403


def test_revoked_device_cannot_sync(client):
    child = register_child(client)
    with SessionLocal() as db:
        db.execute(update(Device).values(revoked_at=datetime.now(timezone.utc)))
        db.commit()
    assert sync(client, child["access_token"]).status_code == 401


def test_sync_updates_device_last_sync(client):
    child = register_child(client)
    sync(client, child["access_token"])
    with SessionLocal() as db:
        device = db.get(Device, uuid.UUID(child["device_id"]))
    assert device.last_sync_at is not None
