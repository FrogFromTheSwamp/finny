"""Тесты загрузки учебного контента (компетенции, граф, уроки, задания)."""
import pytest
from sqlalchemy import func, select, update

from app.db import SessionLocal
from app.models import Competency, CompetencyPrereq, Lesson, Task
from app.seed_content import check_graph, main as seed


def count(model) -> int:
    with SessionLocal() as db:
        return db.scalar(select(func.count()).select_from(model))


def test_seed_loads_everything():
    seed()
    assert count(Competency) == 11
    assert count(CompetencyPrereq) == 9
    assert count(Lesson) == 11
    assert count(Task) == 35


def test_seed_can_run_twice():
    seed()
    seed()
    assert count(Task) == 35


def test_every_task_has_a_grader():
    seed()
    with SessionLocal() as db:
        scenarios = db.scalars(select(Task.scenario)).all()
    graders = {s.get("grader") for s in scenarios}
    assert None not in graders
    assert graders <= {"choice", "number", "basket", "remainder", "pay", "change"}


def test_changed_task_without_new_version_rejected():
    seed()
    with SessionLocal() as db:  # имитируем: кто-то правил задание, не меняя version
        db.execute(
            update(Task)
            .where(Task.id == "budget-4.swipe.1")
            .values(scenario={"grader": "choice", "expected": False})
        )
        db.commit()
    with pytest.raises(ValueError, match="Увеличь version"):
        seed()


def test_graph_cycle_detected():
    with pytest.raises(ValueError, match="Цикл"):
        check_graph({"A": ["B"], "B": ["C"], "C": ["A"]})


def test_graph_unknown_reference_detected():
    with pytest.raises(ValueError, match="неизвестный навык"):
        check_graph({"A": ["Z"]})
