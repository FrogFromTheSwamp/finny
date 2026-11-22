"""Калибровка экономики вычислительным экспериментом.

Перебираем комбинации параметров (сетку), для каждой прогоняем одних и тех же
виртуальных детей (одинаковый seed — «общие случайные числа», чтобы разница
между вариантами шла от параметров, а не от случайности) и считаем, насколько
результат попадает в целевые свойства из модели экономики v1:

  1. «50/30/20» копит на среднюю цель 4–6 недель;
  2. «50/30/20» копит на маленькую цель 1–2 недели;
  3. «50/30/20» почти не получает «особых желаний» (≤ 0.1 в неделю);
  4. у «50/30/20» на нужное уходит 45–60 % дохода;
  5. «забывчивый» тратит на еду больше, чем «50/30/20» (цена бездействия);
  6. «копилка» не скупает всё сразу: большая цель — не быстрее 4 недель.
"""
from __future__ import annotations

import dataclasses
import itertools
import json
import statistics as st
from pathlib import Path

from finny_sim.content import load_content
from finny_sim.simulate import apply_overrides, run_simulation

# Исходная экономика, от которой шла калибровка (для воспроизводимости эксперимента)
BASELINE = Path(__file__).resolve().parents[1] / "calibration" / "economy_v1_0.json"

# Этап 1: грубая сетка от исходной экономики v1.0
GRID = {
    "decay_per_day": [15, 18, 20, 22],
    "goal_multiplier": [1.0, 1.5, 2.0],
    "nudge": [False, True],
}
# Этап 2: уточнение около лучшего варианта + цена «особого угощения»
GRID_FINE = {
    "decay_per_day": [16, 17, 18],
    "goal_multiplier": [1.5],
    "nudge": [True],
    "treat_price": [18, 30, 40],
}

TARGETS = [
    ("50/30/20: средняя цель за 4–6 недель", lambda m: 4 <= m["balanced"]["weeks_to_medium"] <= 6),
    ("50/30/20: маленькая цель за 1–2 недели", lambda m: 1 <= m["balanced"]["weeks_to_small"] <= 2),
    ("50/30/20: «особых желаний» ≤ 0.1 в неделю", lambda m: m["balanced"]["wishes_per_week"] <= 0.1),
    ("50/30/20: нужное 45–60 % дохода", lambda m: 0.45 <= m["balanced"]["need_share"] <= 0.60),
    ("забывчивый тратит на еду больше 50/30/20", lambda m: m["forgetful"]["need_per_week"] > m["balanced"]["need_per_week"]),
    ("копилка: большая цель не быстрее 4 недель", lambda m: m["saver"]["weeks_to_large"] >= 4),
]


def _mean_target(economy: dict, size: str) -> float:
    return st.mean(g["target"] for g in economy["goals"] if g["size"] == size)


def summarize(tables: dict[str, list[dict]], economy: dict) -> dict[str, dict]:
    """Средние показатели по каждой денежной стратегии."""
    strategy_of = {c["child_id"]: c["money_strategy"] for c in tables["children"]}
    weeks = max(int(w["week"]) for w in tables["weekly"]) + 1
    result = {}
    for strategy in sorted(set(strategy_of.values())):
        rows = [w for w in tables["weekly"] if w["money_strategy"] == strategy]
        days = [d for d in tables["daily"] if strategy_of[d["child_id"]] == strategy]
        income = st.mean(w["income"] for w in rows)
        save = st.mean(w["save"] for w in rows)
        weeks_to = lambda size: _mean_target(economy, size) / save if save > 0 else float("inf")  # noqa: E731
        last = [w for w in rows if w["week"] == weeks - 1]
        result[strategy] = dict(
            children=len(last),
            income=income,
            need_share=st.mean(w["need"] for w in rows) / income,
            want_share=st.mean(w["want"] for w in rows) / income,
            save_share=save / income,
            need_per_week=st.mean(w["need"] for w in rows),
            weeks_to_small=weeks_to("small"),
            weeks_to_medium=weeks_to("medium"),
            weeks_to_large=weeks_to("large"),
            wishes_per_week=st.mean(w["wishes"] for w in rows),
            very_hungry_share=st.mean(1.0 if d["very_hungry"] else 0.0 for d in days),
            wallet_end=st.mean(w["wallet_end"] for w in last),
            goals_done=st.mean(w["goals_done"] for w in last),
        )
    return result


def run_grid(
    grid: dict | None = None, children: int = 80, weeks: int = 10, seed: int = 2026,
    baseline: Path | None = BASELINE, progress=print,
) -> list[dict]:
    """Прогнать сетку; вернуть строки «конфигурация × стратегия» и оценку попадания в цели.

    baseline — файл экономики, к которому применяются изменения (по умолчанию исходная v1.0);
    None — текущий content/economy.json.
    """
    grid = grid or GRID
    base = load_content()
    if baseline is not None:
        base = dataclasses.replace(base, economy=json.loads(Path(baseline).read_text(encoding="utf-8")))
    keys = list(grid)
    rows = []
    combos = list(itertools.product(*grid.values()))
    for n, values in enumerate(combos, 1):
        overrides = dict(zip(keys, values))
        economy = apply_overrides(base, overrides).economy
        metrics = summarize(run_simulation(children, weeks, seed, overrides, economy=base.economy), economy)
        passed = [name for name, check in TARGETS if check(metrics)]
        progress(f"[{n}/{len(combos)}] {overrides} → целей выполнено: {len(passed)}/{len(TARGETS)}")
        for strategy, values_by_strategy in metrics.items():
            rows.append(dict(**overrides, strategy=strategy, targets_met=len(passed),
                             passed="; ".join(passed), **values_by_strategy))
    return rows


if __name__ == "__main__":
    import csv
    import sys
    from pathlib import Path

    out = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("calibration.csv")
    table = run_grid() + run_grid(GRID_FINE)
    with out.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(table[0]))
        writer.writeheader()
        writer.writerows(table)
    print(f"Сохранено: {out}")
