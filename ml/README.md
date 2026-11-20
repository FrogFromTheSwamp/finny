# ML-часть Finny

- `finny_sim/` — генератор синтетических данных: виртуальные дети учатся (35 заданий из `content/lessons.json`)
  и распоряжаются монетами по правилам `content/economy.json`. Чистый Python, внешних библиотек не нужно.
- `notebooks/` — Jupyter-ноутбуки с анализом данных и моделями (BKT, сравнение моделей, калибровка экономики).
- `tests/` — тесты генератора.
- `data/` — сгенерированные данные (в git не попадают, всегда можно пересоздать тем же seed).

## Окружение (один раз)
VS Code: Ctrl+Shift+P → **Python: Create Environment** → **Venv** → Python 3.13 →
отметить `ml/requirements.txt` → OK. Появится папка `.venv` в корне проекта.

## Сгенерировать данные
VS Code: панель **Run and Debug** (Ctrl+Shift+D) → в списке вверху выбрать
**«Генератор синтетических данных»** → ▶.
Или в терминале VS Code: `cd ml` и `python -m finny_sim --children 300 --weeks 8 --seed 42`.

Результат — CSV-файлы в `ml/data/sim_v1/` (описание таблиц — в начале `finny_sim/simulate.py`).

## Тесты
VS Code: панель **Testing** (колба слева) → Configure Python Tests → pytest → папка `ml/tests`.
