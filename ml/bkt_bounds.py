"""Шаг 4.1a. Выбор общих верхних границ BKT по валидационным детям из sim_v3."""
import json
from hashlib import sha256
from itertools import product
from pathlib import Path
from time import perf_counter

import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score

from compare_models import BKT_NAMES, ROOT, fit_bkt, learning_steps, predict_bkt

VALIDATION_SEED = 2026
DATA = ROOT / "data" / "sim_v3"
V1 = ROOT / "results" / "knowledge_models_v1.json"
OUTPUT = ROOT / "results" / "knowledge_models_v2_bounds.json"
BOUND_TOLERANCE = 1e-7


def load_steps(data: Path, expected_hash: str) -> pd.DataFrame:
    """Проверить идентичность журнала v1 и собрать шаги только из наблюдаемых полей."""
    path = data / "events.csv"
    if sha256(path.read_bytes()).hexdigest() != expected_hash:
        raise ValueError("Контрольная сумма events.csv отличается от эксперимента v1")
    columns = ["child_id", "session_id", "task_id", "competency_id", "attempt_no",
               "occurred_at", "device_seq", "is_correct"]
    return learning_steps(pd.read_csv(path, usecols=columns))


def split_children(children: list[str], test_ids: list[str], seed: int) -> dict[str, list[str]]:
    """Сохранить тест v1 и отложить 20% остальных детей для выбора границ."""
    children_set, test_set = set(children), set(test_ids)
    if not test_set <= children_set or len(test_set) != len(test_ids):
        raise ValueError("Некорректный список тестовых детей v1")
    pool = sorted(children_set - test_set)
    shuffled = np.random.default_rng(seed).permutation(pool)
    n_val = round(0.2 * len(pool))
    if not 0 < n_val < len(pool):
        raise ValueError("Недостаточно детей для разбиения")
    return {"train": sorted(shuffled[n_val:].tolist()), "validation": sorted(shuffled[:n_val].tolist()),
            "test": sorted(test_set)}


def score(steps: pd.DataFrame) -> dict:
    """AUC и RMSE каждого ответа с учётом нескольких ответов за один шаг."""
    p = steps["BKT"].to_numpy()
    weights = np.r_[steps.correct, steps.wrong]
    auc = roc_auc_score(np.repeat([1, 0], len(p)), np.tile(p, 2), sample_weight=weights)
    answers = int(steps["size"].sum())
    mse = (steps.correct * (1 - p)**2 + steps.wrong * p**2).sum() / answers
    return {"AUC": float(auc), "RMSE": float(np.sqrt(mse)), "answers": answers,
            "children": int(steps.child_id.nunique())}


def evaluate(train: pd.DataFrame, held_out: pd.DataFrame, guess_max: float,
             slip_max: float, learn_max: float) -> dict:
    """Оценить параметры на train; предсказать ответы других детей в порядке времени."""
    limits = (0.999, learn_max, guess_max, slip_max)
    by_skill, predictions = {}, []
    for skill, history in train.groupby("competency_id", sort=True):
        params = fit_bkt(history, guess_max=guess_max, slip_max=slip_max, learn_max=learn_max)
        sample = held_out.loc[held_out.competency_id == skill]
        predicted = sample.assign(BKT=predict_bkt(sample, params))
        predictions.append(predicted)
        at_limit = {}
        for name, value, high in zip(BKT_NAMES, params, limits):
            if abs(value - high) <= BOUND_TOLERANCE:
                at_limit[name] = "upper"
            elif abs(value - 0.001) <= BOUND_TOLERANCE:
                at_limit[name] = "lower"
        by_skill[skill] = {"parameters": dict(zip(BKT_NAMES, params)), "at_limit": at_limit,
                           "metrics": score(predicted)}
    return {"bounds": {"guess_max": guess_max, "slip_max": slip_max, "learn_max": learn_max},
            "metrics": score(pd.concat(predictions)), "by_skill": by_skill}


def experiment() -> dict:
    """Выбрать границы по RMSE, затем по AUC; переобучить и один раз оценить на тесте."""
    started = perf_counter()
    v1 = json.loads(V1.read_text(encoding="utf-8"))
    steps = load_steps(DATA, v1["events_sha256"])
    split = split_children(steps.child_id.unique().tolist(), v1["test_child_ids"], VALIDATION_SEED)
    train = steps.loc[steps.child_id.isin(split["train"])]
    validation = steps.loc[steps.child_id.isin(split["validation"])]
    grid = []
    caps = (0.2, 0.3, 0.4, 0.499)
    for guess, slip, learn in product(caps, caps, (0.5, 0.9, 0.999)):
        grid.append(evaluate(train, validation, guess, slip, learn))
        if len(grid) % 8 == 0:
            print(f"Валидация: {len(grid)}/48", flush=True)
    best = min(grid, key=lambda row: (row["metrics"]["RMSE"], -row["metrics"]["AUC"]))
    test_mask = steps.child_id.isin(split["test"])
    final = evaluate(steps.loc[~test_mask], steps.loc[test_mask], **best["bounds"])
    return {"dataset": DATA.name, "events_sha256": v1["events_sha256"],
            "test_split_seed": v1["split_seed"], "validation_seed": VALIDATION_SEED,
            "children": split, "train_answers": int(train["size"].sum()),
            "selection_rule": "minimum pooled validation RMSE, then maximum AUC",
            "lower_bound": 0.001, "init_upper_bound": 0.999, "boundary_tolerance": BOUND_TOLERANCE,
            "boundary_note": "Параметры с отметкой at_limit не идентифицированы внутри интервала.",
            "validation_grid": grid, "selected_bounds": best["bounds"],
            "refit_train_answers": int(steps.loc[~test_mask, "size"].sum()), "test": final,
            "elapsed_seconds": perf_counter() - started}


if __name__ == "__main__":
    result = experiment()
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + "\n",
                      encoding="utf-8")
    print(f"Время эксперимента: {result['elapsed_seconds']:.2f} с")

