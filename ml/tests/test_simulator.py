"""Тесты генератора синтетических данных.

Запуск: в VS Code — панель Testing (колба слева), или `pytest ml/tests`.
"""
import csv
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from finny_sim.content import load_content, grade  # noqa: E402
from finny_sim.simulate import simulate  # noqa: E402


def read(path: Path) -> list[dict]:
    with path.open(encoding="utf-8") as f:
        return list(csv.DictReader(f))


@pytest.fixture(scope="module")
def data(tmp_path_factory):
    out = tmp_path_factory.mktemp("sim")
    simulate(children=12, weeks=4, seed=7, out=out)
    return out


def test_same_seed_gives_same_data(data, tmp_path):
    simulate(children=12, weeks=4, seed=7, out=tmp_path)
    for name in ("events", "transactions", "weekly"):
        assert (tmp_path / f"{name}.csv").read_bytes() == (data / f"{name}.csv").read_bytes()


def test_every_answer_matches_server_grading(data):
    """Записанная правильность совпадает с оценкой серверного грейдера."""
    tasks = {(t.id, t.version): t for t in load_content().tasks}
    for event in read(data / "events.csv"):
        task = tasks[(event["task_id"], int(event["task_version"]))]
        assert task.competency == event["competency_id"]
        assert grade(task.scenario, json.loads(event["answer"])) == (event["is_correct"] == "True")


def test_attempts_are_numbered_from_one(data):
    counts = {}
    visits = {}
    for event in read(data / "events.csv"):
        task = (event["child_id"], event["task_id"])
        key = (*task, event["session_id"])
        if key not in counts:
            visits[task] = visits.get(task, 0) + 1
        counts[key] = counts.get(key, 0) + 1
        assert int(event["attempt_no"]) == counts[key]
        assert int(event["prior_sessions"]) == visits[task] - 1
    assert max(counts.values()) >= 2
    assert max(visits.values()) >= 2


def test_balances_never_negative(data):
    for row in read(data / "daily.csv"):
        assert int(row["wallet"]) >= 0
        assert int(row["piggy"]) >= 0


def test_weekly_indicators_in_range(data):
    rows = read(data / "weekly.csv")
    assert rows
    for row in rows:
        for key in ("K1_plan", "K2_regular_saving", "K3_pet_care", "K4_restraint", "K5_goal_progress"):
            assert 0.0 <= float(row[key]) <= 1.0, (key, row[key])


def test_allowance_every_monday(data):
    allowances = [t for t in read(data / "transactions.csv") if t["kind"] == "allowance"]
    children = read(data / "children.csv")
    assert len(allowances) == len(children) * 4  # 4 недели — 4 понедельника


def test_week_end_nudge_moves_leftover_to_piggy():
    """Подсказка «остаток в копилку» уменьшает деньги, залежавшиеся в кошельке."""
    from finny_sim.simulate import run_simulation

    def wallet_end(nudge: bool) -> float:
        weekly = run_simulation(30, 4, 11, {"nudge": nudge})["weekly"]
        return sum(w["wallet_end"] for w in weekly) / len(weekly)

    assert wallet_end(True) < wallet_end(False)

def test_retry_then_reopen_payment_task(monkeypatch):
    from dataclasses import replace

    from finny_sim import answers
    from finny_sim.simulate import ChildSim, START

    content = load_content()
    lesson = next(lesson for lesson in content.lessons if lesson.id == "payments-2")
    task = next(task for task in lesson.tasks if task.id == "payments-2.practice.pairs")
    lesson = replace(lesson, tasks=[task])
    child = ChildSim(0, content, 42)
    child.profile = replace(child.profile, abandon=0)
    values = iter([7, 8, 8])
    monkeypatch.setattr(answers, "number_answer", lambda *_: {"value": next(values)})
    child.run_lesson(lesson, False, START)
    child.run_lesson(lesson, False, START)
    assert [event["attempt_no"] for event in child.events] == [1, 2, 1]
    assert [event["is_correct"] for event in child.events] == [False, True, True]
    assert [event["prior_sessions"] for event in child.events] == [0, 0, 1]
