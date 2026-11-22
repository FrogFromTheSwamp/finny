"""Аналитические проверки вероятностей одного шага BKT."""
import pytest

from app.bkt import bkt_step


@pytest.mark.parametrize(("correct", "wrong", "expected"), [
    (0, 0, 0.25),       # нет наблюдения и перехода обучения
    (1, 0, 0.64),       # P(L|верно) = 0.225 / 0.375 = 0.6
    (0, 1, 0.136),      # P(L|ошибка) = 0.025 / 0.625 = 0.04
    (1, 1, 0.1 + 0.9 * 0.0225 / 0.1425),  # один переход на оба ответа
])
def test_forecast_and_updated_mastery(correct: int, wrong: int, expected: float) -> None:
    step = bkt_step(0.25, correct=correct, wrong=wrong, p_guess=0.2, p_slip=0.1, p_learn=0.1)
    assert step.p_correct == pytest.approx(0.375)
    assert step.p_mastery == pytest.approx(expected)


@pytest.mark.parametrize(("guess", "slip", "learn", "correct", "wrong", "expected"), [
    (0.2, 0.0, 0.1, 0, 1, 0.1),  # ошибка исключает уже освоившее состояние
    (0.0, 0.1, 0.1, 1, 0, 1.0),  # верный ответ исключает неосвоившее состояние
    (0.2, 0.1, 0.0, 1, 0, 0.6),  # остаётся только байесовское уточнение
    (0.4, 0.6, 0.1, 1, 1, 0.325),  # исходы одинаково вероятны в обоих состояниях
])
def test_limiting_probabilities(guess: float, slip: float, learn: float,
                                correct: int, wrong: int, expected: float) -> None:
    step = bkt_step(0.25, correct=correct, wrong=wrong, p_guess=guess, p_slip=slip, p_learn=learn)
    assert step.p_mastery == pytest.approx(expected)


def test_nearly_uninformative_answer() -> None:
    step = bkt_step(0.25, correct=1, wrong=0, p_guess=0.499999, p_slip=0.5, p_learn=0.1)
    p_correct = 0.25 * 0.5 + 0.75 * 0.499999
    assert step.p_correct == pytest.approx(p_correct, abs=1e-14)
    assert step.p_mastery == pytest.approx(0.1 + 0.9 * 0.125 / p_correct, abs=1e-14)
    assert step.p_mastery > 0.325


def test_impossible_mixed_observation() -> None:
    with pytest.raises(ValueError, match="равна нулю"):
        bkt_step(0.25, correct=1, wrong=1, p_guess=0.0, p_slip=0.0, p_learn=0.1)


def test_large_group_retains_finite_posterior() -> None:
    step = bkt_step(0.25, correct=1000, wrong=1000, p_guess=0.25, p_slip=0.25, p_learn=0.1)
    assert step.p_mastery == pytest.approx(0.325)

