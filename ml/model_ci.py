"""Шаг 4.1b. Интервалы отражают разброс по тестовым детям при фиксированных,
один раз обученных моделях. Все модели оцениваются на одних и тех же выборках детей.
"""
import json
from itertools import combinations
from pathlib import Path
from time import perf_counter

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score

from bkt_bounds import DATA, V1, load_steps
from compare_models import MODELS, ROOT, fit_skill, metrics

METHOD = "Интервалы отражают разброс по тестовым детям при фиксированных, один раз обученных моделях."
KEYS = ["child_id", "competency_id", "occurred_at", "session_id"]
HISTORY = ["past_correct", "past_wrong"]
ALL_MODELS = (*MODELS, "personal", "task_diagnostic")
PRIOR_WEIGHT = 5
BOOT_SEED = 2026
REPEATS = 2000
OUTPUT = ROOT / "results/knowledge_models_v3_ci.json"


def reproduce_v1(steps: pd.DataFrame, v1: dict) -> tuple[pd.DataFrame, dict]:
    """Обучить исходные модели и сверить их метрики до расчёта новых ориентиров."""
    held_out = steps.child_id.isin(v1["test_child_ids"])
    train = steps.loc[~held_out]
    if (train.child_id.nunique(), train["size"].sum()) != (v1["training_children"], v1["training_answers"]):
        raise ValueError("Обучающая выборка отличается от v1")
    predicted = []
    for skill, history in train.groupby("competency_id", sort=True):
        _, scored = fit_skill(history, steps.loc[held_out & (steps.competency_id == skill)])
        predicted.append(scored)
    scored = pd.concat(predicted)
    actual = metrics(scored)
    if actual != v1["test"]:
        raise ValueError(f"Метрики отличаются от v1: ожидались {v1['test']}, получены {actual}")
    return scored, actual


def attach_steps(events: pd.DataFrame, steps: pd.DataFrame) -> pd.DataFrame:
    """Вернуть task_id каждому первому ответу, сохраняя историю до всего шага."""
    first = events.loc[events.attempt_no == 1].copy()
    first["occurred_at"] = pd.to_datetime(first.occurred_at, utc=True, format="ISO8601")
    merged = first.merge(steps, on=KEYS, how="left", validate="many_to_one", indicator=True)
    if (merged["_merge"] != "both").any():
        raise ValueError("Для части первых ответов отсутствует учебный шаг")
    return merged.drop(columns="_merge")


def task_features(rows: pd.DataFrame, indicators: list[str]) -> np.ndarray:
    """Счётчики до шага и индикаторы заданий. Опорное и новое задания кодируются нулями."""
    columns = [rows[name] for name in HISTORY]
    columns.extend(rows.task_id == task for task in indicators)
    return np.column_stack(columns).astype(float)


def add_baselines(first: pd.DataFrame, scored: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """Обучить диагностическую регрессию внутри навыка и вычислить личную долю."""
    test_mask = first.child_id.isin(scored.child_id.unique())
    test = first.loc[test_mask].merge(scored[KEYS + list(MODELS)], on=KEYS, validate="many_to_one")
    if len(test) != test_mask.sum():
        raise ValueError("Не все ответы теста получили прогноз")
    test["personal"] = ((test.past_correct + PRIOR_WEIGHT * test.rate)
                        / (test.past_correct + test.past_wrong + PRIOR_WEIGHT))
    info = {}
    for skill, train in first.loc[~test_mask].groupby("competency_id"):
        rows = test.loc[test.competency_id == skill]
        counts = train.task_id.value_counts()
        reference = min(counts.index[counts == counts.max()])
        indicators = sorted(set(counts.index) - {reference})
        info[skill] = {"reference_task": reference, "train_task_count": len(counts),
                       "unseen_test_answers": int((~rows.task_id.isin(counts.index)).sum())}
        if indicators:
            # Те же настройки логистической регрессии, что и у PFA в fit_skill.
            model = LogisticRegression(C=1, max_iter=1000, tol=1e-8)
            model.fit(task_features(train, indicators), train.is_correct)
            p = model.predict_proba(task_features(rows, indicators))[:, 1]
        else:
            # Константное задание не добавляет признаков к уже обученной PFA.
            p = rows.PFA
        test.loc[rows.index, "task_diagnostic"] = p
    return test, info


def bootstrap_scores(test: pd.DataFrame, names: tuple[str, ...], repeats: int, seed: int) -> dict:
    """Парные выборки детей с возвращением. Возвращает массив (повторы × AUC, RMSE) по модели."""
    children, child = np.unique(test.child_id, return_inverse=True)
    rng = np.random.default_rng(seed)
    draws = rng.integers(len(children), size=(repeats, len(children)))
    counts = [np.bincount(draw, minlength=len(children)) for draw in draws]
    y = test.is_correct.to_numpy(dtype=float)
    samples = {}
    for name in names:
        p = test[name].to_numpy()
        # Для AUC считаем пары «верно/ошибка» по возрастанию прогноза.
        # Равные прогнозы дают половину балла независимо от порядка строк.
        levels, rank = np.unique(p, return_inverse=True)
        squared_errors = (p - y)**2
        values = np.empty((repeats, 2))
        for i, count in enumerate(counts):
            weight = count[child]
            pos = np.bincount(rank, weights=weight * y, minlength=len(levels))
            neg = np.bincount(rank, weights=weight * (1 - y), minlength=len(levels))
            pairs = pos.sum() * neg.sum()
            if not pairs:
                raise ValueError("В бутстрэп-выборке один класс: AUC не определён")
            auc = np.sum(pos * (neg.cumsum() - 0.5 * neg)) / pairs
            rmse = np.sqrt(np.average(squared_errors, weights=weight))
            values[i] = (auc, rmse)
        samples[name] = values
    return samples


def summarize(points: dict, samples: dict) -> tuple[dict, list[dict]]:
    """Процентильные интервалы моделей и попарных разностей на общих повторах."""
    models = {}
    for name, point in points.items():
        ci = np.quantile(samples[name], [0.025, 0.975], axis=0)
        models[name] = {metric: {"estimate": point[metric], "ci95": ci[:, i].tolist()}
                        for i, metric in enumerate(("AUC", "RMSE"))}
    differences = []
    for b, a in combinations(points, 2):
        ci = np.quantile(samples[a] - samples[b], [0.025, 0.975], axis=0)
        row = {"A": a, "B": b}
        for i, metric in enumerate(("AUC", "RMSE")):
            row[metric] = {"estimate": points[a][metric] - points[b][metric], "ci95": ci[:, i].tolist()}
        differences.append(row)
    return models, differences


def experiment() -> dict:
    """Сравнить пять фиксированных моделей на тесте v1 с кластерным бутстрэпом."""
    started = perf_counter()
    v1 = json.loads(V1.read_text(encoding="utf-8"))
    steps = load_steps(DATA, v1["events_sha256"])
    scored, reference = reproduce_v1(steps, v1)
    print("Три модели точно воспроизвели AUC и RMSE v1.", flush=True)
    events = pd.read_csv(DATA / "events.csv", usecols=KEYS + ["is_correct", "task_id", "attempt_no"])
    first = attach_steps(events, steps[KEYS + HISTORY])
    test, info = add_baselines(first, scored)
    points = {name: reference[name] for name in MODELS}
    for name in ("personal", "task_diagnostic"):
        p = test[name].to_numpy()
        points[name] = {"AUC": float(roc_auc_score(test.is_correct, p)),
                        "RMSE": float(np.sqrt(np.mean((test.is_correct.to_numpy() - p)**2)))}
    samples = bootstrap_scores(test, ALL_MODELS, REPEATS, BOOT_SEED)
    models, pairs = summarize(points, samples)
    return {"dataset": DATA.name, "events_sha256": v1["events_sha256"],
            "dataset_seed": v1["dataset"]["seed"], "split_seed": v1["split_seed"],
            "test_child_ids": v1["test_child_ids"], "train_children": v1["training_children"],
            "train_answers": v1["training_answers"], "test_children": reference["children"],
            "test_answers": reference["answers"], "method": METHOD,
            "bootstrap": {"unit": "child_id", "paired": True, "replacement": True, "seed": BOOT_SEED,
                          "repeats": REPEATS, "percentiles": [2.5, 97.5], "difference": "A minus B"},
            "personal": {"prior_weight": PRIOR_WEIGHT, "formula": "(past_correct + 5 * train_skill_rate) / (past_correct + past_wrong + 5)"},
            "task_diagnostic": {"features": "PFA per skill + task_id indicators", "regularization": "L2, C=1",
                                "unknown_task": "reference task", "by_skill": info},
            "metrics": models, "differences": pairs, "elapsed_seconds": perf_counter() - started}


if __name__ == "__main__":
    result = experiment()
    with OUTPUT.open("x", encoding="utf-8") as target:
        target.write(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + "\n")
    print(f"Время эксперимента: {result['elapsed_seconds']:.2f} с")

