"""Построение ответа ребёнка заданного качества (верного или неверного).

Модель ребёнка решает, ПРАВИЛЬНО ли он ответит; этот модуль превращает
решение в конкретный ответ того же формата, что отправляет приложение.
Каждый ответ проверяется серверным грейдером — расхождение было бы ошибкой.
"""
from __future__ import annotations

import itertools
import random

from finny_sim.content import Task, grade

COINS = [1, 3, 5, 10, 50]


def _subsets(items: list[str]) -> list[list[str]]:
    return [list(c) for r in range(len(items) + 1) for c in itertools.combinations(items, r)]


def choice_answer(task: Task, correct: bool, rng: random.Random) -> dict:
    expected = task.scenario["expected"]
    if correct:
        return {"choice": expected}
    if isinstance(expected, bool):
        return {"choice": not expected}
    if isinstance(expected, str):  # "now" / "later"
        return {"choice": "later" if expected == "now" else "now"}
    return {"choice": rng.choice([v for v in (1, 3, 5) if v != expected])}  # копилки


def number_answer(task: Task, correct: bool, rng: random.Random) -> dict:
    expected = task.scenario["expected"]
    if correct:
        return {"value": expected}
    wrong = expected + rng.choice([-5, -2, -1, 1, 2, 4, 10, 20])
    return {"value": max(0, wrong) if max(0, wrong) != expected else expected + 1}


def shop_answers(
    group: list[Task], intended: dict[str, bool], rng: random.Random
) -> tuple[list[str], dict[str, dict]]:
    """Корзина: сначала решения по отдельным товарам, потом корзина целиком.

    Решения по товарам (задания choice) задают обязательную часть корзины;
    остальные товары подбираются так, чтобы оценка всей корзины совпала с
    задуманной, если это вообще возможно.
    """
    basket_task = next((t for t in group if t.grader == "basket"), None)
    item_tasks = [t for t in group if t.grader == "choice"]
    prices = (basket_task or item_tasks[0]).scenario.get("prices") or {
        t.scenario["item"]: t.scenario["price"] for t in item_tasks
    }

    fixed: dict[str, bool] = {}
    for t in item_tasks:
        should_include = t.scenario["expected"]
        fixed[t.scenario["item"]] = should_include if intended[t.id] else not should_include

    free = [item for item in prices if item not in fixed]
    base = [item for item, inc in fixed.items() if inc]
    candidates = [base + extra for extra in _subsets(free)]
    if basket_task is not None:
        want = intended[basket_task.id]
        matching = [c for c in candidates if grade(basket_task.scenario, {"selected": c}) == want]
        candidates = matching or candidates
    selected = rng.choice(candidates)

    answers = {t.id: {"choice": t.scenario["item"] in selected} for t in item_tasks}
    if basket_task is not None:
        answers[basket_task.id] = {"selected": selected}
    return selected, answers


def remainder_answer(task: Task, selected: list[str], correct: bool, rng: random.Random) -> dict:
    total = sum(task.scenario["prices"][i] for i in selected)
    right = task.scenario["purse"] - total
    if correct:
        return {"selected": selected, "value": right}
    return {"selected": selected, "value": max(0, right + rng.choice([-20, -10, -5, 5, 10, 30]))}


def _coins_for(amount: int, rng: random.Random) -> list[int]:
    """Набор монет на сумму amount (жадно, с небольшим разнообразием)."""
    coins, left = [], amount
    for coin in sorted(COINS, reverse=True):
        while left >= coin and (coin != 50 or rng.random() < 0.8):
            coins.append(coin)
            left -= coin
    while left > 0:
        coins.append(1)
        left -= 1
    return coins


def pay_answer(task: Task, correct: bool, rng: random.Random) -> dict:
    price = task.scenario["price"]
    if correct:
        amount = price if rng.random() < 0.4 else rng.choice([80, 85, 100, 110])
    else:
        amount = rng.choice([50, 60, 65, 70, 74])
    return {"coins": _coins_for(amount, rng)}


def change_answer(task: Task, paid: list[int], correct: bool, rng: random.Random) -> dict:
    right = sum(paid) - task.scenario["price"]
    if correct:
        return {"paid": paid, "change": _coins_for(right, rng)}
    wrong = max(0, right + rng.choice([-10, -5, -2, 3, 5, 10]))
    if wrong == right:
        wrong += 1
    return {"paid": paid, "change": _coins_for(wrong, rng)}


def checked(task: Task, answer: dict) -> bool:
    """Оценка ответа серверным грейдером (истина для журнала)."""
    return grade(task.scenario, answer)
