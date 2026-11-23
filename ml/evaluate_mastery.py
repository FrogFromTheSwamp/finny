"""Оценка зафиксированной BKT по дневной скрытой способности симулятора sim_v3."""
from __future__ import annotations

import json
import sys
from datetime import timedelta, timezone
from pathlib import Path
from tempfile import TemporaryDirectory
from time import perf_counter

import matplotlib
import numpy as np
import pandas as pd
from scipy.stats import rankdata
from sklearn.metrics import roc_auc_score

from bkt_bounds import load_steps

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / "server"))
from app.bkt import bkt_step

matplotlib.use("Agg")
import matplotlib.pyplot as plt

RESULTS = ROOT / "results"
DATA = ROOT / "data" / "sim_v3"
KEY = ["child_id", "competency_id", "date"]
MOSCOW = timezone(timedelta(hours=3))
SEED = 2026
REPEATS = 2000
ILLUSTRATION = "Иллюстрация по одному ребёнку на персону. Доказательной силы у отдельных траекторий нет."


def daily_states(steps: pd.DataFrame, children: list[str], params: dict,
                 dates: pd.DatetimeIndex) -> pd.DataFrame:
    """Оценки на конец местного дня. До первой попытки действует p_init."""
    daily = pd.MultiIndex.from_product([children, sorted(params), dates], names=KEY).to_frame(index=False)
    records = []
    for (child, skill), history in steps.groupby(KEY[:2], sort=False):
        model = params[skill].copy()
        state = model.pop("p_init")
        for step in history.itertuples():
            state = bkt_step(state, correct=step.correct, wrong=step.wrong, **model).p_mastery
            date = step.occurred_at.tz_convert(MOSCOW).normalize().tz_localize(None)
            records.append((child, skill, date, state, step.size))
    observations = pd.DataFrame(records, columns=[*KEY, "p", "answers"])
    observed = observations.groupby(KEY, as_index=False).agg(p=("p", "last"), answers=("answers", "sum"))
    daily = daily.merge(observed, on=KEY, how="left", validate="one_to_one")
    if daily.answers.sum() != steps["size"].sum():
        raise ValueError("Ответы вне календаря оценки")
    daily["answers"] = daily.answers.fillna(0).astype(int)
    daily["p"] = daily.groupby(KEY[:2]).p.ffill().fillna(daily.competency_id.map(
        {skill: row["p_init"] for skill, row in params.items()}))
    daily["has_history"] = daily.groupby(KEY[:2]).answers.cumsum() > 0
    return daily


def child_draws(children: int, repeats: int, seed: int) -> np.ndarray:
    """Число копий каждого ребёнка при выборке с возвращением."""
    rng = np.random.default_rng(seed)
    return np.array([np.bincount(rng.integers(children, size=children), minlength=children)
                     for _ in range(repeats)])


def interval(values: np.ndarray) -> dict:
    valid = values[np.isfinite(values)]
    return {"ci95": np.quantile(valid, [0.025, 0.975]).tolist() if len(valid) else None,
            "valid_repeats": len(valid)}


def spearman(x: np.ndarray, y: np.ndarray) -> float:
    if len(x) < 2 or x.min() == x.max() or y.min() == y.max():
        return np.nan
    a, b = rankdata(x), rankdata(y)
    a -= a.mean()
    b -= b.mean()
    return float((a*b).sum() / np.sqrt((a*a).sum() * (b*b).sum()))


def correlation(frame: pd.DataFrame, draws: np.ndarray) -> dict:
    """Заново ранжировать все строки каждой кластерной выборки с учётом связок."""
    x, y, child = (frame[col].to_numpy() for col in ("p", "true_mastery", "cluster"))
    point = spearman(x, y)
    values = np.empty(len(draws))
    positions = np.arange(len(frame))
    for i, weights in enumerate(draws):
        selected = np.repeat(positions, weights[child])
        values[i] = spearman(x[selected], y[selected])
    return {"n": len(frame), "children": int(frame.child_id.nunique()),
            "rho": point if np.isfinite(point) else None, **interval(values)}


def agreement(frame: pd.DataFrame, draws: np.ndarray) -> list[dict]:
    """Согласие двух порогов и AUC непрерывной P(L) на последний день."""
    predicted = frame.p.to_numpy() >= 0.95
    children = frame.cluster.to_numpy()
    n_children = draws.shape[1]
    counts = np.bincount(children, minlength=n_children)
    totals = draws @ counts
    result = []
    for threshold in (0.5, 0.8, 0.95):
        truth = frame.true_mastery.to_numpy() >= threshold
        equal = truth == predicted
        correct = np.bincount(children[equal], minlength=n_children)
        with np.errstate(invalid="ignore"):
            fractions = (draws @ correct) / totals
        result.append({"truth_threshold": threshold, "n": len(frame),
                       "agreement": float(equal.mean()) if len(frame) else None, **interval(fractions),
                       "tp": int(sum(predicted & truth)), "tn": int(sum(~predicted & ~truth)),
                       "fp": int(sum(predicted & ~truth)), "fn": int(sum(~predicted & truth)),
                       "auc": float(roc_auc_score(truth, frame.p)) if np.unique(truth).size == 2 else None})
    return result


def bins(frame: pd.DataFrame) -> list[dict]:
    """Десять полуинтервалов ширины 0,1, последний включает единицу."""
    edges = np.arange(11) / 10
    labels = np.searchsorted(edges[1:-1], frame.p, side="right")
    result = []
    for i in range(10):
        group = frame.loc[labels == i]
        result.append({"low": edges[i], "high": edges[i+1], "n": len(group),
                       "mean_p": float(group.p.mean()) if len(group) else None,
                       "mean_true_mastery": float(group.true_mastery.mean()) if len(group) else None})
    return result


def plot_examples(daily: pd.DataFrame, children: pd.DataFrame, target: Path) -> list[dict]:
    """Выбор ребёнка по ID до просмотра результатов, одинаковая шкала для всех навыков."""
    result = []
    for persona, group in children.groupby("persona"):
        child = group.child_id.min()
        subset = daily.loc[daily.child_id == child]
        fig, axes = plt.subplots(4, 3, figsize=(11, 10), sharex=True, sharey=True)
        for ax, (skill, rows) in zip(axes.flat, subset.groupby("competency_id")):
            day = (rows.date - daily.date.min()).dt.days + 1
            ax.step(day, rows.p, where="post", color="#2456a4", label="P(L), BKT")
            ax.plot(day, rows.true_mastery, color="#a64912", label="Освоение симулятора")
            ax.set(title=skill, ylim=(-0.03, 1.03))
            ax.grid(alpha=0.22)
        axes.flat[-1].set_visible(False)
        fig.suptitle(f"Персона {persona} · ребёнок {child[:8]}\n{ILLUSTRATION}", fontsize=13)
        fig.legend(*axes.flat[0].get_legend_handles_labels(), loc="lower right", bbox_to_anchor=(0.95, 0.12))
        fig.supxlabel("День симуляции")
        fig.tight_layout(rect=(0, 0.02, 1, 0.95))
        filename = f"mastery_v5_{persona}.png"
        fig.savefig(target / filename, dpi=150)
        plt.close(fig)
        result.append({"persona": persona, "child_id": child, "file": f"figures/{filename}"})
    return result


def main() -> None:
    started = perf_counter()
    v4 = json.loads((RESULTS / "knowledge_models_v4_plearn.json").read_text(encoding="utf-8"))
    meta = json.loads((DATA / "meta.json").read_text(encoding="utf-8"))
    ids = sorted(v4["children"]["test"])
    train = set(v4["children"]["train"] + v4["children"]["validation"])
    if len(train) != 240 or len(set(ids)) != 60 or len(ids) != 60 or train.intersection(ids):
        raise ValueError("Неверное разбиение v4")
    params = {k: v["parameters"] for k, v in v4["test"]["by_skill"].items()}
    dates = pd.date_range(meta["start"], periods=meta["weeks"]*7)
    steps = load_steps(DATA, v4["events_sha256"])
    daily = daily_states(steps.loc[steps.child_id.isin(ids)], ids, params, dates)

    # Только теперь читаем значения скрытой способности, отдельно от журнала ответов.
    truth = pd.read_csv(DATA / "mastery_truth.csv", usecols=[*KEY, "true_mastery"], parse_dates=["date"])
    daily = daily.merge(truth.loc[truth.child_id.isin(ids)], on=KEY, how="outer", validate="one_to_one")
    if daily.isna().any().any() or not daily.true_mastery.between(0, 1).all():
        raise ValueError("Дневные оценки и календарь истины не совпадают")
    daily = daily.sort_values(KEY)
    daily["cluster"] = daily.child_id.map({child: i for i, child in enumerate(ids)})
    draws = child_draws(len(ids), REPEATS, SEED)
    final = daily.loc[daily.date == dates[-1]]
    scopes = {"all_days": daily, "answer_days": daily.loc[daily.answers > 0],
              "last_day": final, "last_day_with_history": final.loc[final.has_history]}
    report = {"model_version": v4["model_version"], "events_sha256": v4["events_sha256"],
              "test_children": ids, "refit_children": len(train), "method": {
                  "alignment": "Конец дня UTC+3, перед ночным забыванием. Шаги learning_steps, затем bkt_step. "
                               "До первого ответа p_init, в дни без ответов перенос последнего P(L).",
                  "truth": "Сигмоида способности с вычетом 0,8 × суммы дефицитов предпосылок. "
                           "Величины от 0 до 1 имеют разный смысл. Корзины описательные.",
                  "bootstrap": {"unit": "ребёнок со всеми днями и навыками, фиксированная модель",
                                "seed": SEED, "repeats": REPEATS, "interval": "процентили 2,5 и 97,5"},
                  "thresholds": "Последний день, P(L) ≥ 0,95. AUC по непрерывной P(L). "
                                "При единственном классе AUC не определена (null).",
                  "examples": ILLUSTRATION + " Выбран минимальный ID тестового ребёнка в каждой персоне."},
              "scopes": {}, "last_day_without_answers": int((~final.has_history).sum())}
    for name, frame in scopes.items():
        summaries = {}
        for skill in ["overall", *sorted(params)]:
            group = frame if skill == "overall" else frame.loc[frame.competency_id == skill]
            row = {"spearman": correlation(group, draws)}
            if name.startswith("last_day"):
                row["thresholds"] = agreement(group, draws)
                row["without_answers"] = int((~group.has_history).sum())
            else:
                row["descriptive_bins"] = bins(group)
            summaries[skill] = row
        report["scopes"][name] = summaries
    profiles = pd.read_csv(DATA / "children.csv", usecols=["child_id", "persona"])
    output = RESULTS / "knowledge_models_v5_mastery_eval.json"
    figures = RESULTS / "figures"
    with TemporaryDirectory(dir=RESULTS) as tmp:
        staging = Path(tmp)
        report["trajectories"] = plot_examples(daily, profiles.loc[profiles.child_id.isin(ids)], staging)
        (staging / output.name).write_text(json.dumps(report, ensure_ascii=False, allow_nan=False, indent=2)
                                          + "\n", encoding="utf-8")
        files = [(staging / Path(item["file"]).name, RESULTS / item["file"]) for item in report["trajectories"]]
        files.append((staging / output.name, output))
        if any(dest.exists() for _, dest in files):
            raise FileExistsError("Результат v5 уже существует")
        figures.mkdir(exist_ok=True)
        for src, dest in files:
            src.rename(dest)
    print(f"Расчёт и графики: {perf_counter()-started:.2f} с")


if __name__ == "__main__":
    main()
