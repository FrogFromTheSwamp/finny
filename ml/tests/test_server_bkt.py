"""Прямое сравнение серверной функции с офлайн-фильтром, без доступа к БД."""
import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "ml"))
sys.path.insert(0, str(ROOT / "server"))
from app.bkt import bkt_step
from compare_models import predict_bkt


def test_server_forecast_and_terminal_mastery_match_offline() -> None:
    # Эталон работает отдельно по навыкам и хранит независимое состояние каждого ребёнка.
    histories = {
        "skill_1": [("a", 1, 0), ("b", 0, 1), ("a", 1, 1), ("a", 0, 2), ("b", 2, 0)],
        "skill_2": [("b", 0, 1), ("a", 2, 1), ("b", 1, 0)],
    }
    parameters = {"skill_1": (0.25, 0.1, 0.2, 0.1), "skill_2": (0.4, 0.07, 0.3, 0.2)}
    for skill, observations in histories.items():
        init, learn, guess, slip = parameters[skill]
        states: dict[str, float] = {}
        forecasts = []
        for child, correct, wrong in observations:
            step = bkt_step(states.get(child, init), correct=correct, wrong=wrong,
                            p_learn=learn, p_guess=guess, p_slip=slip)
            forecasts.append(step.p_correct)
            states[child] = step.p_mastery

        # Прогноз на дополнительный ответ раскрывает последнее состояние эталона:
        # predict_bkt выдаёт P(ответ верен), а не P(L). Сам ответ не участвует в сверке состояния.
        probes = [(child, 1, 0) for child in states]
        history = pd.DataFrame(observations + probes, columns=["child_id", "correct", "wrong"])
        reference = predict_bkt(history, parameters[skill])
        np.testing.assert_allclose(forecasts, reference[:len(observations)], rtol=0, atol=1e-12)
        terminal = (reference[len(observations):] - guess) / (1 - slip - guess)
        np.testing.assert_allclose(list(states.values()), terminal, rtol=0, atol=1e-12)

