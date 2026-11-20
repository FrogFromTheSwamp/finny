"""Проверка ответов ребёнка — детерминированный модуль.

Правильность ответа считает СЕРВЕР по сценарию задания (поле scenario.grader),
а не телефон: так метки для моделей машинного обучения не зависят от ошибок
в клиенте. Каждая функция-грейдер получает сценарий задания и ответ ребёнка
и возвращает True/False. Если ответ имеет неверный формат — GradingError.

Форматы ответов (answer):
    choice     {"choice": <значение>}                  совпадает с scenario.expected
    number     {"value": <целое>}                      равно scenario.expected
    basket     {"selected": [id, ...]}                 корзина укладывается в бюджет
    remainder  {"selected": [id, ...], "value": <целое>}  остаток посчитан верно
    pay        {"coins": [<номинал>, ...]}             собрано не меньше цены
    change     {"paid": [...], "change": [...]}        сдача = оплачено − цена
"""
from collections.abc import Callable
from typing import Any


class GradingError(ValueError):
    """Ответ не подходит по формату к заданию."""


def _require(answer: dict, key: str) -> Any:
    if key not in answer:
        raise GradingError(f"в ответе нет поля '{key}'")
    return answer[key]


def _int(value: Any, name: str) -> int:
    # bool в Python — подкласс int, поэтому True отсекаем явно
    if isinstance(value, bool) or not isinstance(value, int):
        raise GradingError(f"'{name}' должно быть целым числом")
    return value


def _int_list(value: Any, name: str) -> list[int]:
    if not isinstance(value, list):
        raise GradingError(f"'{name}' должно быть списком")
    return [_int(v, name) for v in value]


def _selection(scenario: dict, answer: dict) -> list[str]:
    selected = _require(answer, "selected")
    if not isinstance(selected, list) or not all(isinstance(s, str) for s in selected):
        raise GradingError("'selected' должно быть списком id товаров")
    if len(set(selected)) != len(selected):
        raise GradingError("товар выбран дважды")
    unknown = set(selected) - set(scenario["prices"])
    if unknown:
        raise GradingError(f"неизвестные товары: {sorted(unknown)}")
    return selected


def _total(scenario: dict, selected: list[str]) -> int:
    return sum(scenario["prices"][item] for item in selected)


def grade_choice(scenario: dict, answer: dict) -> bool:
    choice = _require(answer, "choice")
    expected = scenario["expected"]
    # Строгое сравнение типов: True не должно совпасть с 1
    return type(choice) is type(expected) and choice == expected


def grade_number(scenario: dict, answer: dict) -> bool:
    return _int(_require(answer, "value"), "value") == scenario["expected"]


def grade_basket(scenario: dict, answer: dict) -> bool:
    selected = _selection(scenario, answer)
    if len(selected) < scenario.get("min_items", 0):
        return False
    if scenario["purse"] - _total(scenario, selected) < scenario.get("min_left", 0):
        return False
    max_wants = scenario.get("max_wants")
    if max_wants is not None:
        roles = scenario.get("roles", {})
        wants = sum(1 for item in selected if roles.get(item) == "want")
        if wants > max_wants:
            return False
    return True


def grade_remainder(scenario: dict, answer: dict) -> bool:
    selected = _selection(scenario, answer)
    value = _int(_require(answer, "value"), "value")
    return value == scenario["purse"] - _total(scenario, selected)


def grade_pay(scenario: dict, answer: dict) -> bool:
    coins = _int_list(_require(answer, "coins"), "coins")
    allowed = scenario.get("coins")
    if allowed and any(c not in allowed for c in coins):
        raise GradingError("монета несуществующего номинала")
    return sum(coins) >= scenario["price"]


def grade_change(scenario: dict, answer: dict) -> bool:
    paid = _int_list(_require(answer, "paid"), "paid")
    change = _int_list(_require(answer, "change"), "change")
    if sum(paid) <= scenario["price"]:
        raise GradingError("сдача бывает, только если заплачено больше цены")
    return sum(change) == sum(paid) - scenario["price"]


GRADERS: dict[str, Callable[[dict, dict], bool]] = {
    "choice": grade_choice,
    "number": grade_number,
    "basket": grade_basket,
    "remainder": grade_remainder,
    "pay": grade_pay,
    "change": grade_change,
}


def grade(scenario: dict, answer: dict) -> bool:
    """Проверить ответ на задание. Бросает GradingError, если формат не тот."""
    grader = GRADERS.get(scenario.get("grader", ""))
    if grader is None:
        raise GradingError(f"неизвестный грейдер '{scenario.get('grader')}'")
    if not isinstance(answer, dict):
        raise GradingError("ответ должен быть объектом")
    return grader(scenario, answer)
