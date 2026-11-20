"""Запуск генератора: python -m finny_sim --children 300 --weeks 8 --seed 42"""
import argparse
from pathlib import Path

from finny_sim.simulate import simulate

parser = argparse.ArgumentParser(description="Генератор синтетических данных Finny")
parser.add_argument("--children", type=int, default=300, help="сколько виртуальных детей")
parser.add_argument("--weeks", type=int, default=8, help="сколько недель играют")
parser.add_argument("--seed", type=int, default=42, help="зерно случайности (тот же seed — те же данные)")
parser.add_argument("--out", type=Path, default=Path(__file__).resolve().parents[1] / "data" / "sim_v1")
args = parser.parse_args()

meta = simulate(args.children, args.weeks, args.seed, args.out)
for key, value in meta.items():
    print(f"{key}: {value}")
print(f"Готово: {args.out}")
