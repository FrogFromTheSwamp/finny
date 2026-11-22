"""Типы виртуальных детей (учебное поведение) и денежные стратегии.

Значения — разумные допущения, их можно менять: генератор нужен, чтобы
проверить модели и откалибровать экономику, а не чтобы предсказывать
настоящих детей. Настоящие данные дадут только пилот.
"""
from __future__ import annotations

import random
from dataclasses import asdict, dataclass

# name: (доля в выборке, параметры)
PERSONAS: dict[str, tuple[float, dict]] = {
    # старается, учится в нормальном темпе
    "diligent": (0.25, dict(base=0.2, eta=0.35, slip=0.05, guessiness=0.5, visits_per_week=5.0, abandon=0.03, speed=1.0)),
    # быстро схватывает
    "quick": (0.15, dict(base=0.8, eta=0.55, slip=0.04, guessiness=0.4, visits_per_week=4.5, abandon=0.02, speed=0.8)),
    # учится медленно, но не сдаётся
    "slow": (0.20, dict(base=-0.6, eta=0.18, slip=0.08, guessiness=0.6, visits_per_week=4.0, abandon=0.05, speed=1.4)),
    # прокликивает: отвечает быстро и наугад
    "clicker": (0.15, dict(base=-0.3, eta=0.10, slip=0.15, guessiness=1.0, visits_per_week=4.5, abandon=0.10, speed=0.4)),
    # понимает, но часто ошибается по невнимательности
    "careless": (0.15, dict(base=0.5, eta=0.30, slip=0.20, guessiness=0.5, visits_per_week=4.0, abandon=0.04, speed=0.7)),
    # заходит редко
    "rare": (0.10, dict(base=0.0, eta=0.30, slip=0.07, guessiness=0.5, visits_per_week=1.5, abandon=0.06, speed=1.0)),
}

# План недели (нужное, желаемое, накопления, %), порог «пора кормить», выбор еды;
# nudge_accept — насколько охотно соглашается перенести остаток в копилку в итогах недели
MONEY_STRATEGIES: dict[str, dict] = {
    "balanced": dict(nudge_accept=1.0, plan=(50, 30, 20), feed_below=60, food="cheap", impulsive=0.05, save_leftover=False),
    "saver": dict(nudge_accept=1.0, plan=(50, 10, 40), feed_below=45, food="cheap", impulsive=0.02, save_leftover=True),
    "spender": dict(nudge_accept=0.3, plan=(60, 40, 0), feed_below=55, food="tasty", impulsive=0.35, save_leftover=False),
    "impulsive": dict(nudge_accept=0.6, plan=(50, 30, 20), feed_below=40, food="tasty", impulsive=0.5, save_leftover=False),
    "forgetful": dict(nudge_accept=0.8, plan=(50, 30, 20), feed_below=30, food="cheap", impulsive=0.1, save_leftover=False),
}

# Какие денежные стратегии чаще у какого типа ребёнка
STRATEGY_BY_PERSONA: dict[str, dict[str, float]] = {
    "diligent": {"balanced": 0.5, "saver": 0.3, "spender": 0.1, "impulsive": 0.05, "forgetful": 0.05},
    "quick": {"balanced": 0.4, "saver": 0.3, "spender": 0.15, "impulsive": 0.1, "forgetful": 0.05},
    "slow": {"balanced": 0.35, "saver": 0.15, "spender": 0.2, "impulsive": 0.15, "forgetful": 0.15},
    "clicker": {"balanced": 0.1, "saver": 0.05, "spender": 0.35, "impulsive": 0.4, "forgetful": 0.1},
    "careless": {"balanced": 0.3, "saver": 0.15, "spender": 0.2, "impulsive": 0.2, "forgetful": 0.15},
    "rare": {"balanced": 0.25, "saver": 0.15, "spender": 0.15, "impulsive": 0.1, "forgetful": 0.35},
}


@dataclass
class ChildProfile:
    child_id: str
    persona: str
    money_strategy: str
    base: float
    eta: float
    slip: float
    guessiness: float
    visits_per_week: float
    abandon: float
    speed: float
    parent_engagement: float  # вероятность, что взрослый даёт задания на неделе

    def as_row(self) -> dict:
        return asdict(self)


def _weighted(rng: random.Random, weights: dict[str, float]) -> str:
    names = list(weights)
    return rng.choices(names, weights=[weights[n] for n in names])[0]


def sample_profile(child_id: str, rng: random.Random) -> ChildProfile:
    persona = _weighted(rng, {name: share for name, (share, _) in PERSONAS.items()})
    p = PERSONAS[persona][1]
    jitter = lambda v, s: v + rng.gauss(0, s)  # noqa: E731 — индивидуальные отличия внутри типа
    return ChildProfile(
        child_id=child_id,
        persona=persona,
        money_strategy=_weighted(rng, STRATEGY_BY_PERSONA[persona]),
        base=jitter(p["base"], 0.4),
        eta=max(0.03, jitter(p["eta"], 0.05)),
        slip=min(0.35, max(0.01, jitter(p["slip"], 0.02))),
        guessiness=min(1.0, max(0.1, jitter(p["guessiness"], 0.1))),
        visits_per_week=min(7.0, max(0.5, jitter(p["visits_per_week"], 0.8))),
        abandon=min(0.3, max(0.0, jitter(p["abandon"], 0.02))),
        speed=max(0.2, jitter(p["speed"], 0.15)),
        parent_engagement=rng.choice([0.0, 0.0, 0.3, 0.6, 0.9]),
    )
