"""Согласованность обучения BKT с последовательным прогнозом и защита от утечки."""
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
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

