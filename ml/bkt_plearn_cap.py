"""Шаг 4.1d: выбрать наименьший потолок p_learn в допуске по RMSE валидации."""
import json
import sys
from time import perf_counter

import pandas as pd

from bkt_bounds import BOUND_TOLERANCE, DATA, V1, VALIDATION_SEED, evaluate, load_steps, split_children
from compare_models import ROOT

sys.path.insert(0, str(ROOT.parent / "server"))
from app.bkt import bkt_step

CAPS = (0.1, 0.2, 0.3, 0.5, 0.999)
RMSE_MARGIN = 0.0005
V2 = ROOT / "results/knowledge_models_v2_bounds.json"
OUTPUT = ROOT / "results/knowledge_models_v4_plearn.json"


def mastery_table(fit: dict) -> dict:
    """Две независимые цепочки от p_init: каждый ответ образует отдельный шаг."""
    table = {}
    for skill, row in fit["by_skill"].items():
        params = row["parameters"].copy()
        initial = params.pop("p_init")
        record = {"p_init": initial}
        jumps = []
        for outcome, correct in (("correct", 1), ("wrong", 0)):
            prior = initial
            sequence = []
            for _ in range(3):
                prior = bkt_step(prior, correct=correct, wrong=1 - correct, **params).p_mastery
                sequence.append(prior)
            record[outcome] = sequence
            if abs(sequence[0] - initial) > 0.5:
                jumps.append(outcome)
        record["first_jump_above_0_5"] = jumps
        table[skill] = record
    return table


def select_cap(grid: list[dict]) -> float:
    """Правило фиксировано до расчёта; сравниваем значения без округления."""
    threshold = min(row["metrics"]["RMSE"] for row in grid) + RMSE_MARGIN
    return min(row["bounds"]["learn_max"] for row in grid if row["metrics"]["RMSE"] <= threshold)


def validation_run(train: pd.DataFrame, validation: pd.DataFrame, v2: dict) -> list[dict]:
    """Сначала воспроизвести контроль 4.1a; все варианты обучаются на одних детях."""
    upper = CAPS[-1]
    control = evaluate(train, validation, guess_max=0.499, slip_max=0.499, learn_max=upper)
    reference = next(row for row in v2["validation_grid"] if row["bounds"] == control["bounds"])
    if control != reference:
        raise ValueError("Параметры, метрики или отметки границ контрольного варианта отличаются от v2")
    grid = [evaluate(train, validation, guess_max=0.499, slip_max=0.499, learn_max=cap)
            for cap in CAPS[:-1]]
    grid.append(control)
    for row in grid:
        row["mastery_table"] = mastery_table(row)
    return grid


def experiment() -> dict:
    """После выбора по валидации выполнить один пересчёт на отложенных детях."""
    v1 = json.loads(V1.read_text(encoding="utf-8"))
    v2 = json.loads(V2.read_text(encoding="utf-8"))
    steps = load_steps(DATA, v1["events_sha256"])
    split = split_children(steps.child_id.unique().tolist(), v1["test_child_ids"], VALIDATION_SEED)
    if split != v2["children"] or v2["events_sha256"] != v1["events_sha256"]:
        raise ValueError("Данные или разбиение отличаются от 4.1a")
    train = steps.loc[steps.child_id.isin(split["train"])]
    validation = steps.loc[steps.child_id.isin(split["validation"])]
    grid = validation_run(train, validation, v2)
    best = min(row["metrics"]["RMSE"] for row in grid)
    cap = select_cap(grid)
    test_mask = steps.child_id.isin(split["test"])
    final = evaluate(steps.loc[~test_mask], steps.loc[test_mask], guess_max=0.499, slip_max=0.499, learn_max=cap)
    final["mastery_table"] = mastery_table(final)
    return {"dataset": DATA.name, "source": "synthetic", "dataset_metadata": v1["dataset"],
            "events_sha256": v1["events_sha256"], "test_split_seed": v1["split_seed"],
            "validation_seed": VALIDATION_SEED, "children": split,
            "train_answers": int(train["size"].sum()), "refit_train_answers": int(steps.loc[~test_mask, "size"].sum()),
            "selection_rule": "minimum learn_max with pooled validation RMSE <= best validation RMSE + 0.0005",
            "rmse_margin": RMSE_MARGIN, "best_validation_rmse": best, "rmse_threshold": best + RMSE_MARGIN,
            "lower_bound": 0.001, "init_upper_bound": 0.999, "boundary_tolerance": BOUND_TOLERANCE,
            "boundary_note": v2["boundary_note"], "validation_grid": grid,
            "selected_bounds": final["bounds"], "model_version": "bkt-sim-v3-v2", "test": final}


if __name__ == "__main__":
    started = perf_counter()
    result = experiment()
    with OUTPUT.open("x", encoding="utf-8") as target:
        target.write(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + "\n")
    print(f"Потолок: {result['selected_bounds']['learn_max']}; время: {perf_counter() - started:.2f} с")

