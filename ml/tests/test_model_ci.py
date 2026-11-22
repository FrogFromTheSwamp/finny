"""Регрессии шага 4.1b: исходные модели, история и парный бутстрэп детей."""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from bkt_bounds import DATA, V1, load_steps
from compare_models import learning_steps
from model_ci import HISTORY, KEYS, attach_steps, bootstrap_scores, reproduce_v1, task_features


def test_three_models_match_saved_v1() -> None:
    v1 = json.loads(V1.read_text(encoding="utf-8"))
    steps = load_steps(DATA, v1["events_sha256"])
    _, actual = reproduce_v1(steps, v1)
    assert actual == v1["test"]


def test_tasks_share_pre_step_history() -> None:
    events = pd.DataFrame([
        ("a", "s", "x", "k", 1, "2026-09-07T12:00Z", 1, True),
        ("a", "s", "y", "k", 1, "2026-09-07T12:00Z", 2, False),
        ("a", "s", "y", "k", 2, "2026-09-07T12:01Z", 3, True),
        ("a", "s2", "x", "k", 1, "2026-09-08T12:00Z", 4, True),
    ], columns=["child_id", "session_id", "task_id", "competency_id", "attempt_no",
                "occurred_at", "device_seq", "is_correct"])
    steps = learning_steps(events)
    first = attach_steps(events, steps[KEYS + HISTORY])
    assert first.task_id.tolist() == ["x", "y", "x"]
    assert first[HISTORY].values.tolist() == [[0, 0], [0, 0], [1, 1]]
    # При одинаковой истории неизвестное задание и опорное получают один вектор.
    rows = first.iloc[[0, 1]].assign(task_id=["x", "new"])
    assert task_features(rows, ["y"]).tolist() == [[0, 0, 0], [0, 0, 0]]


def test_bootstrap_reproducible_and_matches_resampled_children() -> None:
    rows = pd.DataFrame({"child_id": ["a", "a", "b", "b", "b", "c", "c"],
                         "is_correct": [0, 1, 1, 0, 1, 0, 1],
                         "p": [0.3, 0.3, 0.1, 0.6, 0.7, 0.2, 0.8]})
    output = bootstrap_scores(rows, ("p",), 12, 42)["p"]
    np.testing.assert_array_equal(output, bootstrap_scores(rows, ("p",), 12, 42)["p"])
    assert not np.array_equal(output, bootstrap_scores(rows, ("p",), 12, 7)["p"])
    children = np.sort(rows.child_id.unique())
    draws = np.random.default_rng(42).integers(len(children), size=(12, len(children)))
    for actual, draw in zip(output, draws):
        sample = pd.concat([rows[rows.child_id == children[j]] for j in draw])
        expected = [roc_auc_score(sample.is_correct, sample.p),
                    np.sqrt(np.mean((sample.is_correct - sample.p)**2))]
        np.testing.assert_allclose(actual, expected, rtol=0, atol=1e-14)

