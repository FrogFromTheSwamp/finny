"""Импорт и восстановление mastery на отдельной PostgreSQL-базе finny_test."""
import json
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import func, select

from app.bkt import bkt_step
from app.db import SessionLocal
from app.import_bkt_params import BOUNDS, DEFAULT_VERSION, RULE, VERSION, import_params
from app.models import BktParams, Child, Competency, LearningEvent, LessonSession, Mastery
from app.rebuild_mastery import rebuild_all
from app.seed_content import main as seed


@pytest.fixture
def artifact() -> dict:
    """Минимальные поля артефакта для проверки контракта импортёра."""
    seed()
    with SessionLocal() as db:
        skills = db.scalars(select(Competency.id)).all()
    rows = {}
    for skill in skills:
        guess = 0.499 if skill == "BUD-1" else 0.3
        rows[skill] = {"parameters": {"p_init": 0.3, "p_learn": 0.2, "p_guess": guess, "p_slip": 0.1},
                       "at_limit": {"p_guess": "upper"} if skill == "BUD-1" else {},
                       "metrics": {"AUC": 0.6, "RMSE": 0.4}}
    return {"model_version": VERSION, "dataset": "sim_v3", "source": "synthetic", "selection_rule": RULE,
            "children": {"train": list(range(192)), "validation": list(range(192, 240)), "test": list(range(240, 300))},
            "selected_bounds": BOUNDS, "test": {"bounds": BOUNDS, "by_skill": rows,
                                                "mastery_table": dict.fromkeys(skills)},
            "events_sha256": "a" * 64}


def load(artifact: dict) -> int:
    with SessionLocal.begin() as db:
        return import_params(db, json.dumps(artifact).encode())


def test_import_fills_only_missing_error_flags(artifact: dict) -> None:
    row = artifact["test"]["by_skill"]["BUD-4"]
    row["parameters"].update(p_init=0.1, p_learn=0.5)
    row["at_limit"] = {"p_learn": "upper"}
    assert load(artifact) == 11
    with SessionLocal.begin() as db:
        trained = db.get(BktParams, ("BUD-4", VERSION))
        assert trained.metrics["errors_raise_mastery"] is True
        assert db.get(BktParams, ("BUD-2", VERSION)).metrics["errors_raise_mastery"] is False
        original = dict(trained.metrics)
        trained_at = trained.trained_at
        trained.metrics = {k: v for k, v in original.items() if k != "errors_raise_mastery"}
    assert load(artifact) == 1
    assert load(artifact) == 0
    with SessionLocal.begin() as db:
        trained = db.get(BktParams, ("BUD-4", VERSION))
        assert trained.metrics == original and trained.trained_at == trained_at
        trained.metrics = {**original, "errors_raise_mastery": False}
    with pytest.raises(ValueError, match="конфликт метаданных"):
        load(artifact)


def test_repeat_import_and_version_conflict(artifact: dict) -> None:
    assert load(artifact) == 11
    with SessionLocal() as db:
        old = db.get(BktParams, ("BUD-1", VERSION))
        trained = old.trained_at
        assert old.metrics["at_limit"] == ["p_guess"] and not old.metrics["reliable"]
        assert old.metrics["selection_rule"] == RULE and old.metrics["p_learn_cap"] == 0.5
        assert old.metrics["source"] == "synthetic" and old.metrics["dataset"] == "sim_v3"
        assert db.get(BktParams, ("BUD-2", VERSION)).metrics["reliable"]
    assert load(artifact) == 0
    artifact["test"]["by_skill"]["BUD-1"]["parameters"]["p_init"] = 0.4
    with pytest.raises(ValueError, match="конфликт параметров"):
        load(artifact)
    with SessionLocal() as db:
        old = db.get(BktParams, ("BUD-1", VERSION))
        assert old.p_init == 0.3 and old.is_active and old.trained_at == trained
        assert db.scalar(select(func.count()).select_from(BktParams)) == 11


@pytest.mark.parametrize("invalid", [0, 1, -0.01, 1.01, float("nan")])
def test_invalid_artifact_rolls_back_entire_import(artifact: dict, invalid: float) -> None:
    artifact["test"]["by_skill"]["SEC-1"]["parameters"]["p_slip"] = invalid
    with pytest.raises(ValueError, match="строго внутри"):
        load(artifact)
    with SessionLocal() as db:
        assert db.scalar(select(func.count()).select_from(BktParams)) == 0


def test_replay_after_fallback_grouping_and_logical_duplicate(artifact: dict) -> None:
    child = uuid.uuid4()
    first, later = uuid.uuid4(), uuid.uuid4()
    start = datetime(2026, 11, 1, tzinfo=timezone.utc)
    with SessionLocal.begin() as db:
        db.add(Child(id=child))
        db.flush()
        for session_id in [first, later]:
            db.add(LessonSession(id=session_id, child_id=child, lesson_id="budget-1",
                                 kind="lesson", status="started", started_at=start))
        db.flush()
        # Сначала доставлен поздний правильный ответ. Раннее нажатие — правильный и ошибка.
        data = [(later, "food", 1, True, 1), (first, "food", 1, True, 0),
                (first, "vitamins", 1, False, 0), (first, "food", 1, False, 0),
                (first, "vitamins", 2, True, 0), (None, "food", 1, False, 0)]
        for seq, (session_id, item, attempt, correct, day) in enumerate(data):
            db.add(LearningEvent(id=uuid.uuid4(), child_id=child, session_id=session_id,
                                 task_id=f"budget-1.shop.{item}", task_version=1, attempt_no=attempt,
                                 answer={"choice": correct}, is_correct=correct, device_seq=seq,
                                 occurred_at=start + timedelta(days=day),
                                 received_at=start + timedelta(days=2, seconds=seq)))
    assert rebuild_all() == (1, 1)
    with SessionLocal() as db:
        cached = db.get(Mastery, (child, "BUD-1"))
        assert (cached.attempts, cached.model_version) == (3, DEFAULT_VERSION)
        fallback = db.get(BktParams, ("BUD-1", DEFAULT_VERSION))
        assert fallback.is_active and fallback.metrics["reliable"] is False
        assert fallback.metrics["errors_raise_mastery"] is False
        assert (fallback.p_init, fallback.p_learn, fallback.p_guess, fallback.p_slip) == (0.2, 0.1, 0.25, 0.15)
    assert load(artifact) == 11
    assert rebuild_all() == (1, 1)
    assert rebuild_all() == (1, 0)
    with SessionLocal() as db:
        assert not db.get(BktParams, ("BUD-1", DEFAULT_VERSION)).is_active
        cached = db.get(Mastery, (child, "BUD-1"))
        params = artifact["test"]["by_skill"]["BUD-1"]["parameters"].copy()
        start_p = params.pop("p_init")
        early = bkt_step(start_p, correct=1, wrong=1, **params).p_mastery
        expected = bkt_step(early, correct=1, wrong=0, **params).p_mastery
        assert cached.p_mastery == pytest.approx(expected)
        assert (cached.attempts, cached.model_version) == (3, VERSION)
        assert db.scalar(select(func.count()).select_from(LearningEvent)) == 6

