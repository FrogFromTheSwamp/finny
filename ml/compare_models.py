"""Сравнение трёх прогнозов первой попытки. Запуск: python ml/compare_models.py."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import pandas as pd
import scipy
import sklearn
from scipy.optimize import minimize
from scipy.special import expit, logit
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score

ROOT = Path(__file__).resolve().parent
SPLIT_SEED = 42
BKT_NAMES = ("p_init", "p_learn", "p_guess", "p_slip")
MODELS = ("rate", "PFA", "BKT")


def learning_steps(events):
    first = events.loc[events.attempt_no == 1].copy()
    if first.duplicated(["child_id", "session_id", "task_id"]).any():
        raise ValueError("Несколько первых попыток задания в одной сессии")
    first["occurred_at"] = pd.to_datetime(first.occurred_at, utc=True, format="ISO8601")
    # Один тап может оценивать несколько товаров корзины. Все прогнозы такого
    # шага делаются до того, как модели видят хотя бы один ответ этого шага.
    keys = ["child_id", "competency_id", "occurred_at", "session_id"]
    steps = first.groupby(keys, as_index=False).agg(
        correct=("is_correct", "sum"), size=("is_correct", "size"), seq=("device_seq", "min"))
    steps = steps.sort_values(["child_id", "occurred_at", "seq"]).reset_index(drop=True)
    steps["wrong"] = steps["size"] - steps.correct
    for name in ["correct", "wrong"]:
        steps["past_" + name] = steps.groupby(["child_id", "competency_id"])[name].cumsum() - steps[name]
    return steps


def bkt_paths(steps):
    """В модели без забывания путь определяется числом шагов до освоения.
    k=0: освоено изначально; k=n: навык оставался неосвоенным до последнего ответа.
    """
    successes, failures, lengths, offsets = [], [], [], []
    for _, history in steps.groupby("child_id", sort=False):
        offsets.append(len(successes))
        size = len(history)
        successes.extend(np.r_[0, history.correct.cumsum()])
        failures.extend(np.r_[0, history.wrong.cumsum()])
        lengths.extend([size] * (size + 1))
    offsets = np.asarray(offsets)
    lengths = np.asarray(lengths)
    k = np.arange(len(lengths)) - np.repeat(offsets, lengths[offsets] + 1)
    return (offsets, k, lengths, np.asarray(successes), np.asarray(failures))


def bkt_loss(params, paths):
    init, learn, guess, slip = params
    offsets, k, n, good_before, bad_before = paths
    last = np.repeat(offsets + n[offsets], n[offsets] + 1)
    # Суммируем правдоподобия всех возможных моментов перехода для каждого ребёнка.
    log_path = np.where(k == 0, np.log(init), np.log1p(-init)
                        + np.maximum(k - 1, 0) * np.log1p(-learn)
                        + (k < n) * np.log(learn))
    log_path += (good_before * np.log(guess) + bad_before * np.log1p(-guess)
                 + (good_before[last] - good_before) * np.log1p(-slip)
                 + (bad_before[last] - bad_before) * np.log(slip))
    peaks = np.maximum.reduceat(log_path, offsets)
    scaled = np.exp(log_path - np.repeat(peaks, n[offsets] + 1))
    return -np.sum(peaks + np.log(np.add.reduceat(scaled, offsets)))


def fit_bkt(steps):
    paths = bkt_paths(steps)
    fits = []
    for initial in [(0.2, 0.1, 0.25, 0.15), (0.65, 0.02, 0.4, 0.25), (0.4, 0.3, 0.1, 0.05)]:
        fit = minimize(bkt_loss, initial, args=(paths,), method="L-BFGS-B",
                       bounds=[(0.001, 0.999)] * 2 + [(0.001, 0.499)] * 2)
        if fit.success:
            fits.append(fit)
    if not fits:
        raise RuntimeError("Не удалось оценить параметры BKT")
    return min(fits, key=lambda fit: fit.fun).x


def predict_bkt(steps, params):
    init, learn, guess, slip = params
    states, predictions = {}, []
    for row in steps.itertuples():
        prior = states.get(row.child_id, init)
        predictions.append(guess + prior * (1 - slip - guess))
        evidence = row.correct * np.log((1 - slip) / guess) + row.wrong * np.log(slip / (1 - guess))
        posterior = expit(logit(prior) + evidence)
        states[row.child_id] = posterior + (1 - posterior) * learn
    return np.asarray(predictions)


def fit_skill(train, test):
    rate = train.correct.sum() / train["size"].sum()
    # Стандартная PFA: отдельные свободный член и два коэффициента для навыка.
    # Две строки с весами сохраняют вклад каждого ответа при общем прогнозе шага.
    features = ["past_correct", "past_wrong"]
    x = train[features].to_numpy()
    weights = np.r_[train.correct, train.wrong]
    labels = np.repeat([1, 0], len(train))
    clf = LogisticRegression(C=1, max_iter=1000, tol=1e-8)
    clf.fit(np.tile(x, (2, 1))[weights > 0], labels[weights > 0], sample_weight=weights[weights > 0])
    bkt = fit_bkt(train)
    model = {"rate": rate, "PFA": dict(zip(["intercept", "success", "failure"],
                                            [clf.intercept_[0], *clf.coef_[0]])),
             "BKT": dict(zip(BKT_NAMES, bkt))}
    scored = test.assign(rate=rate, PFA=clf.predict_proba(test[features].to_numpy())[:, 1],
                         BKT=predict_bkt(test, bkt))
    return model, scored


def metrics(steps):
    result = {"answers": int(steps["size"].sum()), "children": int(steps.child_id.nunique())}
    for name in MODELS:
        p = steps[name].to_numpy()
        weights = np.r_[steps.correct, steps.wrong]
        auc = roc_auc_score(np.repeat([1, 0], len(p)), np.tile(p, 2), sample_weight=weights)
        mse = (steps.correct * (1 - p)**2 + steps.wrong * p**2).sum() / result["answers"]
        result[name] = {"AUC": float(auc), "RMSE": float(np.sqrt(mse))}
    return result


def paired_rmse_intervals(scored):
    """Парные 95%-интервалы по детям при фиксированных обученных моделях."""
    errors = pd.DataFrame({"child_id": scored.child_id, "answers": scored["size"]})
    for name in MODELS:
        p = scored[name]
        errors[name] = scored.correct * (1 - p)**2 + scored.wrong * p**2
    totals = errors.groupby("child_id").sum().to_numpy()
    rng = np.random.default_rng(2026)
    draws = rng.integers(len(totals), size=(2000, len(totals)))
    sums = totals[draws].sum(axis=1)
    rmse = np.sqrt(sums[:, 1:] / sums[:, :1])
    return {f"{a} minus {b}": np.quantile(rmse[:, MODELS.index(a)] - rmse[:, MODELS.index(b)],
                                           [0.025, 0.975]).tolist()
            for a, b in [("BKT", "PFA"), ("BKT", "rate"), ("PFA", "rate")]}


def compare(data):
    metadata = json.loads((data / "meta.json").read_text(encoding="utf-8"))
    if metadata.get("attempt_scope") != "session_task":
        raise ValueError("Нужен набор с нумерацией попыток внутри сессии (sim_v3)")
    path = data / "events.csv"
    columns = ["child_id", "session_id", "task_id", "competency_id", "attempt_no",
               "occurred_at", "device_seq", "is_correct"]
    steps = learning_steps(pd.read_csv(path, usecols=columns))
    children = np.sort(steps.child_id.unique())
    n_test = max(1, round(len(children) * 0.2))
    test_ids = np.random.default_rng(SPLIT_SEED).permutation(children)[:n_test]
    held_out = steps.child_id.isin(test_ids)
    scores, models = [], {}
    for skill in sorted(steps.competency_id.unique()):
        subset = steps.competency_id == skill
        train, test = steps[subset & ~held_out], steps[subset & held_out]
        if test.empty or train.empty:
            raise ValueError(f"Недостаточно данных для оценки {skill}")
        models[skill], scored = fit_skill(train, test)
        scores.append(scored)
    scored = pd.concat(scores)
    return {
        "dataset": metadata, "events_sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "libraries": {"numpy": np.__version__, "pandas": pd.__version__,
                      "scipy": scipy.__version__, "sklearn": sklearn.__version__},
        "split_seed": SPLIT_SEED, "test_child_ids": sorted(test_ids),
        "training_children": len(children) - n_test,
        "training_answers": int(steps.loc[~held_out, "size"].sum()),
        "models": models, "test": metrics(scored),
        "paired_rmse_ci95": paired_rmse_intervals(scored),
        "by_skill": {k: metrics(v) for k, v in scored.groupby("competency_id")},
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=ROOT / "data/sim_v3")
    parser.add_argument("--out", type=Path, default=ROOT / "results/knowledge_models_v1.json")
    args = parser.parse_args()
    result = compare(args.data)
    args.out.parent.mkdir(exist_ok=True, parents=True)
    args.out.write_text(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + "\n",
                        encoding="utf-8")
    print(json.dumps(result["test"], indent=2))

