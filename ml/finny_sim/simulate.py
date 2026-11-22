"""Симуляция: виртуальные дети день за днём играют в Finny.

Результат — таблицы в формате, близком к базе сервера:
  children.csv      профиль и скрытые параметры каждого ребёнка;
  sessions.csv      прохождения уроков (completed / abandoned);
  events.csv        ответы на задания (как learning_events) + «правда» для оценки моделей:
                    true_p — истинная вероятность верного ответа,
                    true_mastery — истинная освоенность навыка до ответа;
  mastery_truth.csv истинная освоенность каждого навыка на конец каждого дня;
  transactions.csv  движения монет; daily.csv — состояние питомца и денег по дням;
  weekly.csv        итоги недель с показателями K1–K5.
Один и тот же seed всегда даёт одни и те же данные.
"""
from __future__ import annotations

import copy
import csv
import dataclasses
import json
import math
import random
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from finny_sim import answers as A
from finny_sim.content import NO_RETRY_STEPS, SOFT_TASKS, Content, Lesson, Task, load_content, load_json
from finny_sim.economy import Economy
from finny_sim.learner import Learner
from finny_sim.personas import sample_profile

START = datetime(2026, 9, 7)  # понедельник, местное время (Москва, UTC+3)
UTC_OFFSET = timedelta(hours=3)
MAX_ATTEMPTS = 8
BASE_MS = {"choice": 3500, "number": 9000, "basket": 12000, "remainder": 9000, "pay": 11000, "change": 9000}
TRANSFER_SKILLS = ("BUD-2", "BUD-4", "SAV-2")  # навыки, от которых зависит следование плану


def stamp(local: datetime) -> str:
    return (local - UTC_OFFSET).replace(tzinfo=timezone.utc).isoformat()


class ChildSim:
    def __init__(self, index: int, content: Content, seed: int):
        self.rng = random.Random(f"{seed}-{index}")
        self.content = content
        self.profile = sample_profile(self._uuid(), self.rng)
        self.learner = Learner(self.profile, content, self.rng)
        self.economy = Economy(
            self.profile, content, self.rng, START, self._uuid, stamp,
            savings_skill=lambda: (self.learner.mastery("SAV-1") + self.learner.mastery("SAV-2")) / 2,
        )
        self.seq = 0
        self.sessions: list[dict] = []
        self.events: list[dict] = []
        self.mastery_rows: list[dict] = []
        self.daily_rows: list[dict] = []
        self.completed: set[str] = set()
        self.resume_at: dict[str, int] = {}  # брошенный урок → с какого шага продолжить
        self.task_sessions: dict[str, int] = {}
        self.first_correct: dict[str, bool] = {}

    def _uuid(self) -> str:
        return str(uuid.UUID(int=self.rng.getrandbits(128), version=4))

    # ---------- уроки ----------

    def next_lesson(self) -> tuple[Lesson, bool]:
        """Следующий непройденный урок по порядку; когда всё пройдено — повтор."""
        for lesson in self.content.lessons:
            if lesson.id not in self.completed:
                return lesson, True
        with_tasks = [l for l in self.content.lessons if l.tasks]
        return self.rng.choice(with_tasks), False

    def run_lesson(self, lesson: Lesson, first_time: bool, t: datetime) -> datetime:
        session_id = self._uuid()
        start_step = self.resume_at.pop(lesson.id, 0) if first_time else 0
        session = dict(id=session_id, child_id=self.profile.child_id, lesson_id=lesson.id,
                       kind="lesson", status="completed", started_at=stamp(t), finished_at=None,
                       first_time=first_time)
        self.sessions.append(session)
        attempts: dict[str, int] = {}
        context: dict = {}
        t += timedelta(seconds=self.rng.uniform(20, 60))  # обложка и теория

        steps = lesson.steps()
        for step_index in range(start_step, len(steps)):
            group = steps[step_index]
            if group[0].grader == "change" and sum(context.get("paid", [])) <= group[0].scenario["price"]:
                continue  # заплатил без сдачи — шага со сдачей нет, как в приложении
            for attempt in range(1, MAX_ATTEMPTS + 1):
                passed, t = self.attempt_group(group, context, attempts, session_id, t)
                if passed:
                    break
                if attempt == MAX_ATTEMPTS or self.rng.random() < self.profile.abandon * attempt:
                    session.update(status="abandoned", finished_at=stamp(t))
                    if first_time:
                        self.resume_at[lesson.id] = step_index
                    return t

        session["finished_at"] = stamp(t)
        if first_time:
            self.completed.add(lesson.id)
            tasks = lesson.tasks
            accuracy = sum(self.first_correct.get(x.id, False) for x in tasks) / len(tasks) if tasks else 1.0
            self.economy.lesson_reward(t, accuracy)
            chapter = self.content.chapter_lessons(lesson.chapter)
            if all(l.id in self.completed for l in chapter):
                self.economy.chapter_reward(t)
        return t

    def attempt_group(self, group: list[Task], context: dict, attempts: dict[str, int], session_id: str, t: datetime):
        """Одна попытка шага: ребёнок решает, как ответить, сервер оценивает."""
        p = {task.id: self.learner.p_correct(task) for task in group}
        mastery = {task.id: self.learner.mastery(task.competency) for task in group}
        intended = {tid: self.rng.random() < prob for tid, prob in p.items()}

        first = group[0]
        if first.step == "shop" and first.grader != "remainder":
            context["selected"], built = A.shop_answers(group, intended, self.rng)
        elif first.grader == "remainder":
            built = {first.id: A.remainder_answer(first, context.get("selected", []), intended[first.id], self.rng)}
        elif first.grader == "pay":
            built = {first.id: A.pay_answer(first, intended[first.id], self.rng)}
            context["paid"] = built[first.id]["coins"]
        elif first.grader == "change":
            built = {first.id: A.change_answer(first, context["paid"], intended[first.id], self.rng)}
        elif first.grader == "number":
            built = {first.id: A.number_answer(first, intended[first.id], self.rng)}
        else:  # choice: карточки, приоритеты, монеты
            built = {task.id: A.choice_answer(task, intended[task.id], self.rng) for task in group}

        duration = int(BASE_MS[first.grader] * self.profile.speed * math.exp(self.rng.gauss(0, 0.35)))
        t += timedelta(milliseconds=duration)
        passed = True
        for task in group:
            correct = A.checked(task, built[task.id])
            attempt_no = attempts.get(task.id, 0) + 1
            attempts[task.id] = attempt_no
            if attempt_no == 1:
                self.task_sessions[task.id] = self.task_sessions.get(task.id, 0) + 1
            self.first_correct.setdefault(task.id, correct)
            self.seq += 1
            self.events.append(dict(
                id=self._uuid(), child_id=self.profile.child_id, session_id=session_id,
                task_id=task.id, task_version=task.version, competency_id=task.competency,
                grader=task.grader, attempt_no=attempt_no, prior_sessions=self.task_sessions[task.id] - 1,
                answer=json.dumps(built[task.id], ensure_ascii=False),
                is_correct=correct, duration_ms=duration, device_seq=self.seq, occurred_at=stamp(t),
                true_p=round(p[task.id], 4), true_mastery=round(mastery[task.id], 4),
            ))
            self.learner.practice(task, correct)
            if not correct and task.id not in SOFT_TASKS and first.step not in NO_RETRY_STEPS:
                passed = False
        return passed, t + timedelta(seconds=self.rng.uniform(2, 6))

    # ---------- день за днём ----------

    def follow_probability(self) -> float:
        """Следует ли ребёнок своему денежному плану — растёт с освоением навыков."""
        skill = sum(self.learner.mastery(s) for s in TRANSFER_SKILLS) / len(TRANSFER_SKILLS)
        return 0.35 + 0.55 * skill

    def run(self, weeks: int) -> None:
        for day in range(weeks * 7):
            date = START + timedelta(days=day)
            if date.weekday() == 0:
                self.economy.start_week(date)
            for hour in (6, 12):
                self.economy.sample(date + timedelta(hours=hour))

            if self.rng.random() < self.profile.visits_per_week / 7:
                t = date + timedelta(hours=15, minutes=self.rng.randint(0, 240))
                follow = self.rng.random() < self.follow_probability()
                self.economy.visit(t, follow)
                for _ in range(1 + (self.rng.random() < 0.4)):
                    lesson, first_time = self.next_lesson()
                    t = self.run_lesson(lesson, first_time, t)
                self.economy.visit(t + timedelta(minutes=1), follow)

            self.economy.sample(date + timedelta(hours=18))
            end = date + timedelta(hours=23, minutes=59)
            self.economy.sample(end)
            self.daily_rows.append(self.economy.daily_row(end))
            for skill in self.content.competencies:
                self.mastery_rows.append(dict(child_id=self.profile.child_id, date=date.date().isoformat(),
                                              competency_id=skill, true_mastery=round(self.learner.mastery(skill), 4)))
            self.learner.end_of_day()
        self.economy.close_week()


def _write(path: Path, rows: list[dict]) -> None:
    if not rows:
        return
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def apply_overrides(content: Content, overrides: dict | None) -> Content:
    """Подменить параметры экономики для вычислительного эксперимента (калибровки).

    decay_per_day — скорость голода; goal_multiplier — множитель цен целей;
    treat_price — цена «особого угощения»;
    nudge — включена ли подсказка «остаток в копилку» в итогах недели.
    """
    if not overrides:
        return content
    economy = copy.deepcopy(content.economy)
    if "decay_per_day" in overrides:
        economy["hunger"]["decay_per_day"] = overrides["decay_per_day"]
    if "goal_multiplier" in overrides:
        for goal in economy["goals"]:
            if goal["size"] != "tutorial":
                goal["target"] = round(goal["target"] * overrides["goal_multiplier"])
    if "treat_price" in overrides:
        for food in economy["foods"]:
            if food["id"] in economy["special_treats"]:
                food["price"] = overrides["treat_price"]
    if "nudge" in overrides:
        economy["week_end_nudge"] = {**economy.get("week_end_nudge", {}), "enabled": overrides["nudge"]}
    return dataclasses.replace(content, economy=economy)


def run_simulation(
    children: int, weeks: int, seed: int, overrides: dict | None = None, economy: dict | None = None
) -> dict[str, list[dict]]:
    """Прогнать симуляцию и вернуть таблицы в памяти (без записи файлов).

    economy — подменить параметры экономики целиком (например, исходной v1.0 для калибровки).
    """
    content = load_content()
    if economy is not None:
        content = dataclasses.replace(content, economy=copy.deepcopy(economy))
    content = apply_overrides(content, overrides)
    tables: dict[str, list[dict]] = {k: [] for k in
        ("children", "sessions", "events", "mastery_truth", "transactions", "daily", "weekly")}
    for index in range(children):
        sim = ChildSim(index, content, seed)
        sim.run(weeks)
        tables["children"].append(sim.profile.as_row())
        tables["sessions"] += sim.sessions
        tables["events"] += sim.events
        tables["mastery_truth"] += sim.mastery_rows
        tables["transactions"] += sim.economy.transactions
        tables["daily"] += sim.daily_rows
        tables["weekly"] += sim.economy.weekly_rows
    return tables


def simulate(children: int, weeks: int, seed: int, out: Path, overrides: dict | None = None) -> dict:
    tables = run_simulation(children, weeks, seed, overrides)
    out.mkdir(parents=True, exist_ok=True)
    for name, rows in tables.items():
        _write(out / f"{name}.csv", rows)
    meta = dict(catalog_version=load_json("lessons.json")["version"], economy_version=load_json("economy.json")["version"],
                attempt_scope="session_task", children=children, weeks=weeks, seed=seed, start=START.date().isoformat(), overrides=overrides,
                **{f"rows_{k}": len(v) for k, v in tables.items()})
    (out / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    return meta
