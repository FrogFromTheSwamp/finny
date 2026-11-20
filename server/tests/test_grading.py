"""Тесты модуля проверки ответов. База здесь не нужна: это чистые функции."""
import pytest

from app.grading import GradingError, grade

WEEK = {
    "grader": "basket", "purse": 100, "min_left": 20, "max_wants": 1, "min_items": 1,
    "prices": {"food": 45, "vitamins": 15, "bubbles": 15, "sweets": 20},
    "roles": {"food": "need", "vitamins": "need", "bubbles": "want", "sweets": "want"},
}


# ---------- choice ----------

def test_choice_correct_and_wrong():
    scenario = {"grader": "choice", "expected": "now"}
    assert grade(scenario, {"choice": "now"}) is True
    assert grade(scenario, {"choice": "later"}) is False


def test_choice_does_not_confuse_true_with_1():
    # В Python True == 1, но для ребёнка «согласен» и «монета 1» — разные ответы
    assert grade({"grader": "choice", "expected": 1}, {"choice": True}) is False
    assert grade({"grader": "choice", "expected": True}, {"choice": 1}) is False


def test_missing_field_is_format_error():
    with pytest.raises(GradingError):
        grade({"grader": "choice", "expected": True}, {"answer": True})


# ---------- number ----------

def test_number():
    scenario = {"grader": "number", "expected": 10}
    assert grade(scenario, {"value": 10}) is True
    assert grade(scenario, {"value": 14}) is False
    with pytest.raises(GradingError):
        grade(scenario, {"value": "10"})


# ---------- basket ----------

def test_basket_needs_and_one_want_fit():
    assert grade(WEEK, {"selected": ["food", "vitamins", "bubbles"]}) is True  # 75, остаток 25


def test_basket_too_little_left():
    # 45 + 15 + 20 = 80, остаток 20 — ровно на границе, это ещё нормально
    assert grade(WEEK, {"selected": ["food", "vitamins", "sweets"]}) is True
    # 45 + 15 + 15 + 20 = 95: и остаток мал, и «хочу» два
    assert grade(WEEK, {"selected": ["food", "vitamins", "bubbles", "sweets"]}) is False


def test_basket_empty_is_wrong():
    assert grade(WEEK, {"selected": []}) is False


def test_basket_unknown_or_repeated_item_is_format_error():
    with pytest.raises(GradingError):
        grade(WEEK, {"selected": ["pizza"]})
    with pytest.raises(GradingError):
        grade(WEEK, {"selected": ["food", "food"]})


# ---------- remainder ----------

def test_remainder():
    scenario = {"grader": "remainder", "purse": 100, "prices": {"icecream": 30, "teddy": 70}}
    assert grade(scenario, {"selected": ["icecream"], "value": 70}) is True
    assert grade(scenario, {"selected": ["icecream"], "value": 30}) is False


# ---------- pay / change ----------

def test_pay():
    scenario = {"grader": "pay", "price": 75, "coins": [1, 3, 5, 10, 50]}
    assert grade(scenario, {"coins": [50, 10, 10, 5]}) is True  # ровно 75
    assert grade(scenario, {"coins": [50, 50]}) is True  # больше — будет сдача
    assert grade(scenario, {"coins": [50, 10]}) is False
    with pytest.raises(GradingError):
        grade(scenario, {"coins": [100]})  # такой монеты в игре нет


def test_change():
    scenario = {"grader": "change", "price": 75}
    assert grade(scenario, {"paid": [50, 50], "change": [10, 10, 5]}) is True
    assert grade(scenario, {"paid": [50, 50], "change": [10, 10]}) is False
    with pytest.raises(GradingError):
        grade(scenario, {"paid": [50, 10], "change": []})  # заплатили меньше цены


def test_unknown_grader():
    with pytest.raises(GradingError):
        grade({"grader": "magic"}, {"choice": 1})
