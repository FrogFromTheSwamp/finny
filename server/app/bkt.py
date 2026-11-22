"""Один шаг Bayesian Knowledge Tracing для одного ребёнка и одного навыка."""
import math
from typing import NamedTuple


class BktStep(NamedTuple):
    """Прогноз до наблюдения и вероятность освоения после шага."""

    p_correct: float
    p_mastery: float


def _log_power(probability: float, count: int) -> float:
    """Логарифм вероятности count исходов; для пустого набора вклад равен нулю."""
    if count == 0:
        return 0.0
    if probability == 0:
        return -math.inf
    return count * math.log(probability)


def bkt_step(prior: float, *, correct: int, wrong: int, p_learn: float,
             p_guess: float, p_slip: float) -> BktStep:
    """Учесть группу первых ответов одного нажатия, начиная с prior (изначально p_init).

    По Байесу вес каждого состояния равен его исходной вероятности, умноженной
    на правдоподобие всех ответов группы. Нормируем веса и один раз применяем
    переход обучения. Пустая группа оставляет prior прежним.
    """
    if not all(0 <= p <= 1 for p in (prior, p_learn, p_guess, p_slip)):
        raise ValueError("Вероятности BKT должны быть в [0, 1]")
    if any(type(n) is not int or n < 0 for n in (correct, wrong)):
        raise ValueError("Число ответов должно быть целым и неотрицательным")

    p_correct = prior * (1 - p_slip) + (1 - prior) * p_guess
    if correct + wrong == 0:
        return BktStep(p_correct, prior)

    learned = _log_power(prior, 1) + _log_power(1 - p_slip, correct) + _log_power(p_slip, wrong)
    unknown = _log_power(1 - prior, 1) + _log_power(p_guess, correct) + _log_power(1 - p_guess, wrong)
    peak = max(learned, unknown)
    if peak == -math.inf:
        raise ValueError("Вероятность наблюдаемой группы ответов равна нулю")

    # Вычитание максимума сохраняет отношение весов даже у большой группы.
    learned_weight = math.exp(learned - peak)
    unknown_weight = math.exp(unknown - peak)
    posterior = learned_weight / (learned_weight + unknown_weight)
    return BktStep(p_correct, posterior + (1 - posterior) * p_learn)

