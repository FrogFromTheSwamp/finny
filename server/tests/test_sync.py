"""Тесты синхронизации обучения: сессии и ответы ребёнка."""
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from threading import Barrier

import pytest
from sqlalchemy import delete, func, select, text, update

from app.bkt import bkt_step
from app.db import SessionLocal
from app.import_bkt_params import DEFAULT_PARAMS, DEFAULT_VERSION
from app.models import Device, LearningEvent, LessonSession, Mastery
from app.rebuild_mastery import rebuild_all
from app.routers import sync as sync_router
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

    assert [r["status"] for r in data["events"]] == ["accepted", "duplicate"]
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

def test_queued_answers_use_the_original_card_version(client):
    token = register_child(client)["access_token"]
    old = event("payments-3.swipe.2", {"choice": True})
    new = {**event("payments-3.swipe.2", {"choice": True}), "task_version": 2}
    result = sync(client, token, events=[old, new]).json()["events"]
    assert [(entry["status"], entry["is_correct"]) for entry in result] == [
        ("accepted", True), ("accepted", False)
    ]


def mastery_rows() -> dict:
    with SessionLocal() as db:
        return {m.competency_id: (m.p_mastery, m.attempts, m.model_version)
                for m in db.scalars(select(Mastery))}


def after(prior: float, correct: int, wrong: int) -> float:
    params = {name: value for name, value in DEFAULT_PARAMS.items() if name != "p_init"}
    return bkt_step(prior, correct=correct, wrong=wrong, **params).p_mastery


def test_late_group_online_matches_full_rebuild(client) -> None:
    token = register_child(client)["access_token"]
    s, later = session(), session()
    early_time = now_iso(timedelta(days=-1))
    food = event("budget-1.shop.food", {"choice": True}, s["id"], occurred_at=early_time)
    vitamins = event("budget-1.shop.vitamins", {"choice": False}, s["id"], occurred_at=early_time)
    latest = event("budget-1.shop.food", {"choice": False}, later["id"])
    sync(client, token, [s, later], [latest])
    sync(client, token, events=[food])
    data = sync(client, token, events=[vitamins]).json()
    assert data["warnings"] == []
    online = mastery_rows()
    early = after(DEFAULT_PARAMS["p_init"], correct=1, wrong=1)
    assert online == {"BUD-1": (after(early, correct=0, wrong=1), 3, DEFAULT_VERSION)}
    with SessionLocal.begin() as db:
        db.execute(delete(Mastery))
    assert rebuild_all() == (1, 1)
    assert mastery_rows() == online


def test_mixed_batch_rebuilds_only_new_first_answers(client, monkeypatch) -> None:
    token = register_child(client)["access_token"]
    s = session()
    food = event("budget-1.shop.food", {"choice": True}, s["id"], device_seq=10)
    logical = {**food, "id": str(uuid.uuid4()), "answer": {"choice": False}, "device_seq": 1}
    weekly = event("savings-2.weekly", {"value": 10}, s["id"])
    calls = []
    rebuild = sync_router.rebuild_child

    def track(db, child_id, skills):
        calls.append(set(skills))
        return rebuild(db, child_id, skills)

    monkeypatch.setattr(sync_router, "rebuild_child", track)
    assert sync(client, token, [s], [weekly]).status_code == 200
    old_clock = {**weekly, "occurred_at": now_iso(timedelta(days=2))}
    batch = [food, logical, old_clock, {**logical, "id": str(uuid.uuid4()), "attempt_no": 2},
             event("savings-2.weekly", {"value": 9}), event("unknown", {}, s["id"])]
    data = sync(client, token, events=batch).json()
    assert [r["status"] for r in data["events"]] == [
        "accepted", "accepted", "duplicate", "accepted", "accepted", "rejected"]
    assert data["warnings"] == [{"code": "duplicate_first_attempt", "event_id": logical["id"]}]
    assert stored_events() == 5
    with SessionLocal() as db:
        assert db.get(LearningEvent, uuid.UUID(food["id"])).occurred_at == datetime.fromisoformat(food["occurred_at"])
    assert mastery_rows()["BUD-1"] == (after(DEFAULT_PARAMS["p_init"], 1, 0), 1, DEFAULT_VERSION)
    assert mastery_rows()["SAV-3"][1] == 1
    before = mastery_rows()
    assert sync(client, token, events=batch).json()["warnings"] == []
    next_id = {**logical, "id": str(uuid.uuid4())}
    assert sync(client, token, events=[next_id]).json()["warnings"][0]["event_id"] == next_id["id"]
    assert stored_events() == 6
    assert calls == [{"SAV-3"}, {"BUD-1"}]
    assert rebuild_all() == (1, 0) and mastery_rows() == before


def test_clock_shift_preserves_two_presses_in_one_session(client) -> None:
    token = register_child(client)["access_token"]
    s = session()
    start = datetime.now(timezone.utc) + timedelta(days=2)
    gap = timedelta(milliseconds=413)
    first = event("budget-1.shop.food", {"choice": True}, s["id"], occurred_at=start.isoformat())
    second = event("budget-1.shop.vitamins", {"choice": False}, s["id"],
                   occurred_at=(start + gap).isoformat())
    assert sync(client, token, [s], [second, first]).json()["warnings"] == []
    with SessionLocal() as db:
        later = db.get(LearningEvent, uuid.UUID(second["id"])).occurred_at
        earlier = db.get(LearningEvent, uuid.UUID(first["id"])).occurred_at
        assert later - earlier == gap and later <= datetime.now(timezone.utc)
    expected = after(after(DEFAULT_PARAMS["p_init"], 1, 0), 0, 1)
    assert mastery_rows()["BUD-1"] == (expected, 2, DEFAULT_VERSION)


def test_failed_rebuild_commits_events_and_keeps_previous_mastery(client, monkeypatch) -> None:
    token = register_child(client)["access_token"]
    first, second = session(), session()
    weekly = event("savings-2.weekly", {"value": 10}, first["id"])
    sync(client, token, [first], [weekly])
    previous = mastery_rows()
    rebuild = sync_router.rebuild_child

    def fail_after_write(db, child_id, skills):
        rebuild(db, child_id, skills)
        db.flush()
        db.execute(text("SELECT 1 / 0"))

    monkeypatch.setattr(sync_router, "rebuild_child", fail_after_write)
    events = [event("savings-2.weekly", {"value": 9}, second["id"]),
              event("budget-1.shop.food", {"choice": True}, second["id"])]
    result = sync(client, token, [second], events).json()
    assert [r["status"] for r in result["events"]] == ["accepted", "accepted"]
    assert [w["code"] for w in result["warnings"]] == ["mastery_rebuild_failed"]
    assert stored_events() == 3 and mastery_rows() == previous
    assert sync(client, token, events=events).json()["warnings"] == []
    assert rebuild_all() == (1, 2)
    assert mastery_rows()["SAV-3"][1] == 2
    assert mastery_rows()["BUD-1"][1] == 1


def test_concurrent_sync_same_child_keeps_both_batches(client) -> None:
    token = register_child(client)["access_token"]
    s = session()
    barrier = Barrier(2)

    def send(choice: bool) -> dict:
        first = event("budget-1.shop.food", {"choice": choice}, s["id"])
        other = (event("budget-1.shop.vitamins", {"choice": True}, s["id"]) if choice
                 else event("savings-2.weekly", {"value": 10}, s["id"]))
        barrier.wait(timeout=10)
        response = sync(client, token, [s], [first, other])
        assert response.status_code == 200
        return response.json()

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(send, [True, False]))
    assert sorted(r["sessions"][0]["status"] for r in results) == ["accepted", "duplicate"]
    assert all(e["status"] == "accepted" for r in results for e in r["events"])
    assert [w["code"] for r in results for w in r["warnings"]] == ["duplicate_first_attempt"]
    assert stored_events() == 4
    assert {k: v[1] for k, v in mastery_rows().items()} == {"BUD-1": 2, "SAV-3": 1}
    assert rebuild_all() == (1, 0)
