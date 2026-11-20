"""Загрузка учебного контента и параметров экономики из папки content/.

Генератор читает те же файлы, что сервер и приложение, поэтому виртуальные
дети проходят ровно те задания, которые есть в игре.
"""
from __future__ import annotations

import json
import sys
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONTENT = ROOT / "content"

# Грейдеры сервера: генератор проверяет ими каждый свой ответ
sys.path.insert(0, str(ROOT / "server"))
from app.grading import grade  # noqa: E402

CHAPTER_ORDER = ["budget", "savings", "payments"]

# Задания, ошибка в которых не заставляет переделывать шаг
# (в budget-1 «Хорошо получилось» тоже завершает урок).
SOFT_TASKS = {"budget-1.shop.basket"}
# Шаги без повторов: неверная карточка показывает объяснение, и урок идёт дальше
NO_RETRY_STEPS = {"swipe"}


def load_json(name: str) -> dict:
    return json.loads((CONTENT / name).read_text(encoding="utf-8"))


@dataclass(frozen=True)
class Task:
    id: str
    version: int
    lesson_id: str
    competency: str
    step: str
    scenario: dict = field(hash=False, compare=False)

    @property
    def grader(self) -> str:
        return self.scenario["grader"]


@dataclass
class Lesson:
    id: str
    chapter: str
    number: int
    tasks: list[Task]

    def steps(self) -> list[list[Task]]:
        """Группы заданий, которые ребёнок отправляет на проверку одним нажатием.

        Корзина и доска приоритетов проверяются целиком; остаток, оплата,
        сдача, карточки и монеты — по одному.
        """
        groups: dict[str, list[Task]] = {}
        for task in self.tasks:
            if task.step in ("shop", "priority") and task.grader != "remainder":
                key = f"{task.lesson_id}.{task.step}"
            else:
                key = task.id
            groups.setdefault(key, []).append(task)
        return list(groups.values())


@dataclass
class Content:
    competencies: dict[str, dict]
    prereqs: dict[str, list[str]]
    lessons: list[Lesson]
    economy: dict

    @property
    def tasks(self) -> list[Task]:
        return [t for lesson in self.lessons for t in lesson.tasks]

    def chapter_lessons(self, chapter: str) -> list[Lesson]:
        return [lesson for lesson in self.lessons if lesson.chapter == chapter]


def load_content() -> Content:
    comp = load_json("competencies.json")
    competencies = {c["id"]: c for c in comp["competencies"]}
    prereqs = {c["id"]: list(c["requires"]) for c in comp["competencies"]}

    lessons: list[Lesson] = []
    for raw in load_json("lessons.json")["lessons"]:
        tasks = [
            Task(
                id=t["id"],
                version=t["version"],
                lesson_id=raw["id"],
                competency=t["competency"],
                step=t["step"],
                scenario=t["scenario"],
            )
            for t in raw["tasks"]
        ]
        lessons.append(Lesson(id=raw["id"], chapter=raw["chapter"], number=raw["number"], tasks=tasks))
    lessons.sort(key=lambda l: (CHAPTER_ORDER.index(l.chapter), l.number))
    return Content(competencies, prereqs, lessons, load_json("economy.json"))
