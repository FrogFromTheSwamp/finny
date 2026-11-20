"""«Истинная» модель знаний виртуального ребёнка (скрыта от BKT).

Устроена НЕ как BKT — иначе проверка BKT на этих данных была бы нечестной:
- навык — непрерывная способность θ (логит-шкала), а не «знает / не знает»;
- слабые базовые навыки мешают продвинутым (граф навыков): эффективная
  способность θ_eff = θ − λ·Σ(1 − σ(θ_пред));
- вероятность верного ответа: p = g + (1 − g − slip)·σ(θ_eff − b),
  где g — шанс угадать (зависит от числа вариантов и склонности угадывать),
  b — трудность задания;
- обучение: после попытки θ растёт на η·(1 − σ(θ_eff − b))·(готовность
  базовых навыков); после ошибки — вдвое меньше (объяснение тоже учит);
- забывание: без практики θ медленно возвращается к стартовому уровню.
"""
from __future__ import annotations

import math
import random
import zlib

from finny_sim.content import Content, Task
from finny_sim.personas import ChildProfile

PREREQ_PENALTY = 0.8  # λ
FORGET_PER_DAY = 0.02
LEVEL_OFFSET = {"basic": 0.0, "advanced": -0.8}
GRADER_DIFFICULTY = {"choice": -0.3, "number": 0.6, "basket": 0.5, "remainder": 0.7, "pay": 0.0, "change": 0.6}


def sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def task_difficulty(task: Task) -> float:
    """Трудность задания: по типу проверки плюс постоянный «характер» задания."""
    task_rng = random.Random(zlib.crc32(task.id.encode()))  # одинаково для всех детей и запусков
    return GRADER_DIFFICULTY[task.grader] + task_rng.gauss(0, 0.3)


def guess_floor(task: Task, guessiness: float) -> float:
    """Шанс угадать, не зная: зависит от числа вариантов ответа."""
    if task.grader == "choice":
        options = 3 if task.step == "sort" else 2
        return guessiness / options
    if task.grader == "basket":
        return 0.15 * guessiness
    if task.grader == "pay":
        return 0.3 * guessiness  # набрать «побольше монет» легко и наугад
    return 0.03 * guessiness  # число и сдачу почти не угадать


class Learner:
    def __init__(self, profile: ChildProfile, content: Content, rng: random.Random):
        self.profile = profile
        self.content = content
        self.theta0 = {
            skill: profile.base + LEVEL_OFFSET[c["level"]] + rng.gauss(0, 0.5)
            for skill, c in content.competencies.items()
        }
        self.theta = dict(self.theta0)
        self.practiced_today: set[str] = set()

    def effective(self, skill: str) -> float:
        penalty = sum(1 - sigmoid(self.theta[p]) for p in self.content.prereqs[skill])
        return self.theta[skill] - PREREQ_PENALTY * penalty

    def mastery(self, skill: str) -> float:
        """Истинная «освоенность» навыка (для оценки моделей, BKT её не видит)."""
        return sigmoid(self.effective(skill))

    def p_correct(self, task: Task) -> float:
        g = guess_floor(task, self.profile.guessiness)
        know = sigmoid(self.effective(task.competency) - task_difficulty(task))
        return g + (1 - g - self.profile.slip) * know

    def practice(self, task: Task, correct: bool) -> None:
        skill = task.competency
        prereqs = self.content.prereqs[skill]
        readiness = sum(sigmoid(self.theta[p]) for p in prereqs) / len(prereqs) if prereqs else 1.0
        gap = 1 - sigmoid(self.effective(skill) - task_difficulty(task))
        self.theta[skill] += self.profile.eta * gap * readiness * (1.0 if correct else 0.5)
        self.practiced_today.add(skill)

    def end_of_day(self) -> None:
        for skill in self.theta:
            if skill not in self.practiced_today:
                self.theta[skill] -= FORGET_PER_DAY * (self.theta[skill] - self.theta0[skill])
        self.practiced_today.clear()
