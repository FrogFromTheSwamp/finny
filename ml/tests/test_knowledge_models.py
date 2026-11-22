"""Согласованность обучения BKT с последовательным прогнозом и защита от утечки."""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from bkt_bounds import DATA, V1, evaluate, load_steps, split_children
from compare_models import bkt_loss, bkt_paths, learning_steps, predict_bkt


def test_training_likelihood_matches_forward_filter():
    history = pd.DataFrame({"child_id": ["a", "a", "a", "b"],
                            "correct": [1, 0, 1, 0], "wrong": [1, 2, 0, 1]})
    params = (0.3, 0.12, 0.2, 0.1)
    init, learn, guess, slip = params
    nll, predictions = 0, []
    for _, rows in history.groupby("child_id"):
        prior = init
        for row in rows.itertuples():
            predictions.append(prior * (1 - slip) + (1 - prior) * guess)
            learned = prior * (1 - slip)**row.correct * slip**row.wrong
            unknown = (1 - prior) * guess**row.correct * (1 - guess)**row.wrong
            nll -= np.log(learned + unknown)
            prior = (learned + learn * unknown) / (learned + unknown)
    assert bkt_loss(params, bkt_paths(history)) == pytest.approx(nll)
    np.testing.assert_allclose(predict_bkt(history, params), predictions)


def test_only_previous_first_attempts_enter_the_next_step():
    events = pd.DataFrame([
        ("a", "s", "food", "budget", 1, "2026-09-07T12:00Z", 1, True),
        ("a", "s", "soap", "budget", 1, "2026-09-07T12:00Z", 2, False),
        ("a", "s", "soap", "budget", 2, "2026-09-07T12:01Z", 3, True),
        ("a", "s2", "food", "budget", 1, "2026-09-08T12:00Z", 4, False),
        ("b", "s3", "food", "budget", 1, "2026-09-08T12:00Z", 1, True),
    ], columns=["child_id", "session_id", "task_id", "competency_id", "attempt_no",
                "occurred_at", "device_seq", "is_correct"])
    steps = learning_steps(events.iloc[::-1])
    assert steps[["size", "past_correct", "past_wrong"]].values.tolist() == [
        [2, 0, 0], [1, 1, 1], [1, 0, 0]]



def test_child_split_is_reproducible() -> None:
    children = [str(i) for i in range(300)]
    test = children[:60]
    split = split_children(children, test, 2026)
    assert split == split_children(children[::-1], test, 2026)
    assert split["validation"] != split_children(children, test, 2027)["validation"]


def test_train_validation_test_are_disjoint() -> None:
    children = [str(i) for i in range(300)]
    split = split_children(children, children[:60], 2026)
    train, validation, test = (set(split[key]) for key in ("train", "validation", "test"))
    assert (len(train), len(validation), len(test)) == (192, 48, 60)
    assert train.isdisjoint(validation) and train.isdisjoint(test) and validation.isdisjoint(test)
    assert train | validation | test == set(children)
    assert test == set(children[:60])


def test_original_bounds_and_split_reproduce_v1() -> None:
    """Контрольный прогон требует локального sim_v3 той же версии, что и v1."""
    v1 = json.loads(V1.read_text(encoding="utf-8"))
    steps = load_steps(DATA, v1["events_sha256"])
    split = split_children(steps.child_id.unique().tolist(), v1["test_child_ids"], 2026)
    train = steps.loc[steps.child_id.isin(split["train"] + split["validation"])]
    test = steps.loc[steps.child_id.isin(split["test"])]
    assert train.child_id.nunique() == v1["training_children"]
    assert train["size"].sum() == v1["training_answers"]
    actual = evaluate(train, test, guess_max=0.499, slip_max=0.499, learn_max=0.999)
    assert actual["by_skill"].keys() == v1["models"].keys()
    for skill, row in actual["by_skill"].items():
        assert row["parameters"] == v1["models"][skill]["BKT"]
        expected = v1["by_skill"][skill]
        assert row["metrics"] == {**expected["BKT"], "answers": expected["answers"],
                                  "children": expected["children"]}
    expected = v1["test"]
    assert actual["metrics"] == {**expected["BKT"], "answers": expected["answers"],
                                 "children": expected["children"]}
