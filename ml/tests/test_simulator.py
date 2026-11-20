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
    first = {}
    for event in read(data / "events.csv"):
        key = (event["child_id"], event["task_id"])
        first.setdefault(key, int(event["attempt_no"]))
    assert set(first.values()) == {1}


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
