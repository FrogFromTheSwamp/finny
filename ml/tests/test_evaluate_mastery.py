"""Дневное сопоставление, шаги BKT и статистика на малых проверяемых примерах."""
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest
from scipy.stats import spearmanr

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from compare_models import learning_steps, predict_bkt
from evaluate_mastery import agreement, bins, child_draws, correlation, daily_states


def test_local_day_grouped_answers_and_carry_match_predict_bkt() -> None:
    # 21:01 UTC уже относится к следующему дню симулятора.
    times = ["2026-09-07T21:01Z"] * 2 + ["2026-09-09T18:00Z"]
    events = pd.DataFrame({"child_id": "a", "competency_id": "s", "session_id": "x",
                           "task_id": ["i", "j", "k"], "occurred_at": times,
                           "is_correct": [True, False, True], "device_seq": [1, 2, 3], "attempt_no": 1})
    steps = learning_steps(events)
    params = {"p_init": 0.2, "p_learn": 0.15, "p_guess": 0.18, "p_slip": 0.1}
    frame = daily_states(steps, ["a", "b"], {"s": params}, pd.date_range("2026-09-07", periods=4))
    probe = pd.concat([steps, steps.tail(1)], ignore_index=True)
    forecasts = predict_bkt(probe, tuple(params.values()))
    states = (forecasts - params["p_guess"]) / (1 - params["p_slip"] - params["p_guess"])
    a = frame.loc[frame.child_id == "a"]
    np.testing.assert_allclose(a.p, [params["p_init"], states[1], states[2], states[2]], atol=1e-14)
    assert a.answers.tolist() == [0, 2, 1, 0]
    assert a.has_history.tolist() == [False, True, True, True]
    b = frame.loc[frame.child_id == "b"]
    assert b.p.eq(0.2).all() and not b.has_history.any()


def test_cluster_intervals_rerank_whole_children_with_ties() -> None:
    frame = pd.DataFrame({"cluster": [0, 0, 1, 1, 2], "child_id": list("aabbc"),
                          "p": [0.2, 0.2, 0.8, 0.5, 0.1], "true_mastery": [0.5, 0.6, 0.3, 0.3, 0.7]})
    draws = child_draws(3, 40, 2026)
    np.testing.assert_array_equal(draws, child_draws(3, 40, 2026))
    expected = []
    for weights in draws:
        sample = frame.iloc[np.repeat(np.arange(len(frame)), weights[frame.cluster])]
        if sample.p.nunique() > 1 and sample.true_mastery.nunique() > 1:
            expected.append(spearmanr(sample.p, sample.true_mastery).statistic)
    result = correlation(frame, draws)
    assert result["rho"] == pytest.approx(spearmanr(frame.p, frame.true_mastery).statistic)
    assert result["valid_repeats"] == len(expected)
    np.testing.assert_allclose(result["ci95"], np.quantile(expected, [0.025, 0.975]))


def test_thresholds_inclusive_and_auc_uses_continuous_scores() -> None:
    frame = pd.DataFrame({"p": [0.1, 0.95, 0.9, 1], "true_mastery": [0.4, 0.8, 0.5, 0.8],
                          "cluster": [0, 1, 2, 3]})
    draws = np.array([[1, 1, 1, 1], [1, 0, 3, 0]])
    low, middle, high = agreement(frame, draws)
    assert (low["tp"], low["tn"], low["fp"], low["fn"]) == (2, 1, 0, 1)
    assert low["auc"] == 1 and low["agreement"] == 0.75
    assert low["ci95"] == pytest.approx(np.quantile([0.75, 0.25], [0.025, 0.975]))
    assert middle["agreement"] == 1 and high["auc"] is None
    table = bins(frame)
    assert table[0]["mean_p"] is None and table[1]["n"] == 1 and table[9]["n"] == 3
