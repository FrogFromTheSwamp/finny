"""Проверки выбора потолка p_learn без повторного обращения к тестовым ответам."""
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from bkt_plearn_cap import (CAPS, DATA, OUTPUT, V1, V2, VALIDATION_SEED, load_steps,
                            select_cap, split_children, validation_run)


@pytest.fixture(scope="module")
def validation_result() -> tuple[dict, list[dict]]:
    """Заново получить разбиение и пять моделей на обучающей части sim_v3."""
    v1 = json.loads(V1.read_text(encoding="utf-8"))
    v2 = json.loads(V2.read_text(encoding="utf-8"))
    steps = load_steps(DATA, v1["events_sha256"])
    split = split_children(steps.child_id.unique().tolist(), v1["test_child_ids"], VALIDATION_SEED)
    train = steps.loc[steps.child_id.isin(split["train"])]
    validation = steps.loc[steps.child_id.isin(split["validation"])]
    return split, validation_run(train, validation, v2)


def test_validation_run_reproduces_v4(validation_result: tuple[dict, list[dict]]) -> None:
    split, grid = validation_result
    saved = json.loads(OUTPUT.read_text(encoding="utf-8"))
    assert split == saved["children"]
    assert [row["bounds"]["learn_max"] for row in grid] == list(CAPS)
    assert grid == saved["validation_grid"]
    assert select_cap(grid) == saved["selected_bounds"]["learn_max"]


def test_original_cap_matches_v2(validation_result: tuple[dict, list[dict]]) -> None:
    _, grid = validation_result
    v2 = json.loads(V2.read_text(encoding="utf-8"))
    control = next(row for row in grid if row["bounds"]["learn_max"] == 0.999)
    expected = next(row for row in v2["validation_grid"] if row["bounds"] == control["bounds"])
    assert {key: control[key] for key in expected} == expected


def test_choose_smallest_cap_including_threshold() -> None:
    grid = [{"bounds": {"learn_max": cap}, "metrics": {"RMSE": rmse}}
            for cap, rmse in [(0.999, 0.45), (0.2, 0.45 + 0.0005), (0.1, 0.4505001)]]
    assert select_cap(grid) == 0.2

