"""Экономика виртуального ребёнка по правилам content/economy.json (модель v1).

Кошелёк и копилка, голод питомца в реальном времени, карманные деньги по
понедельникам, проценты на копилку, награды за уроки, «особое желание»
после долгого голода, задания от взрослого, цели. Каждое движение денег
записывается операцией (как в таблицу transactions), а итоги недели —
строкой с показателями K1–K5 для индекса финансовой дисциплины.
"""
from __future__ import annotations

import math
import random
from datetime import datetime, timedelta
from typing import Callable

from finny_sim.content import Content
from finny_sim.personas import MONEY_STRATEGIES, ChildProfile

FOOD_TARGET = 85  # кормим, пока сытость не станет такой
NEED_PER_DAY = 7  # сколько монет в день откладывает на еду «планирующий» ребёнок


class Economy:
    def __init__(
        self,
        profile: ChildProfile,
        content: Content,
        rng: random.Random,
        start: datetime,
        new_id: Callable[[], str],
        stamp: Callable[[datetime], str],
        savings_skill: Callable[[], float] = lambda: 0.5,
    ):
        self.e = content.economy
        self.h = self.e["hunger"]
        self.profile = profile
        self.strategy = MONEY_STRATEGIES[profile.money_strategy]
        self.rng = rng
        self.new_id = new_id
        self.stamp = stamp
        self.savings_skill = savings_skill  # освоенность навыков накоплений (от модели знаний)
        self.foods = self.e["foods"]
        self.food_by_id = {f["id"]: f for f in self.foods}

        self.wallet = 0
        self.piggy = 0
        self.hunger = float(self.h["start"])
        self.last_t = start
        self.very_hungry_since: datetime | None = None
        self.wish_pending = False
        self.owned_hats: set[str] = set()
        self.fed_on: datetime | None = None
        self.goal = self.e["goals"][0]  # первая цель — колпак из обучения
        self.goals_done: list[str] = []

        self.transactions: list[dict] = []
        self.weekly_rows: list[dict] = []
        self.week: dict | None = None
        self.week_index = -1
        self.parent_tasks: list[tuple[datetime, int]] = []

    # ---------- время и голод ----------

    def advance(self, t: datetime) -> None:
        """Сытость убывает со временем; отмечаем вход в зону «очень голоден»."""
        days = (t - self.last_t).total_seconds() / 86400
        if days <= 0:
            return
        decay, limit = self.h["decay_per_day"], self.h["very_hungry_below"]
        new = max(0.0, self.hunger - decay * days)
        if self.hunger >= limit > new:
            self.very_hungry_since = self.last_t + timedelta(days=(self.hunger - limit) / decay)
        self.hunger, self.last_t = new, t
        wish_after = timedelta(hours=self.h["special_wish_after_hours"])
        if self.very_hungry_since and t - self.very_hungry_since >= wish_after and not self.wish_pending:
            self.wish_pending = True
            if self.week is not None:
                self.week["wishes"] += 1

    def very_hungry(self) -> bool:
        return self.hunger < self.h["very_hungry_below"]

    def sample(self, t: datetime) -> None:
        """Замер состояния для показателя K3 «забота о питомце»."""
        self.advance(t)
        if self.week is not None:
            self.week["samples"] += 1
            self.week["ok_samples"] += 0 if self.very_hungry() else 1

    # ---------- операции ----------

    def _tx(self, t, account, amount, kind, necessity=None, item=None, title=""):
        self.transactions.append(
            dict(
                id=self.new_id(),
                child_id=self.profile.child_id,
                occurred_at=self.stamp(t),
                week=self.week_index,
                account=account,
                amount=amount,
                kind=kind,
                necessity=necessity,
                item_id=item,
                title=title,
            )
        )

    def _track_piggy(self):
        if self.week is not None:
            self.week["min_piggy"] = min(self.week["min_piggy"], self.piggy)

    def earn(self, t, amount, kind, title):
        if amount <= 0:
            return
        self.wallet += amount
        self.week["income"] += amount
        self._tx(t, "wallet", amount, kind, title=title)

    def spend(self, t, price, kind, necessity, item, title):
        self.wallet -= price
        self.week[necessity] += price
        self._tx(t, "wallet", -price, kind, necessity, item, title)

    def deposit(self, t, amount):
        amount = min(amount, self.wallet)
        if amount <= 0:
            return
        self.wallet -= amount
        self.piggy += amount
        self.week["save"] += amount
        self.week["deposits"] += 1
        self._tx(t, "wallet", -amount, "goal_deposit", "save", self.goal["id"], "В копилку")
        self._tx(t, "piggy", amount, "goal_deposit", "save", self.goal["id"], "В копилку")

    # ---------- неделя ----------

    def start_week(self, t: datetime) -> None:
        """Понедельник: итоги прошлой недели, проценты, карманные деньги, план."""
        if self.week is not None:
            self.week_end_nudge(t - timedelta(minutes=1))
            self.close_week()
            interest = math.floor(self.e["interest"]["weekly_rate"] * self.week["min_piggy"])
            if interest > 0:
                self.piggy += interest
                self._tx(t, "piggy", interest, "interest", title="Проценты по копилке")
        self.week_index += 1
        need, want, save = self.strategy["plan"]
        self.week = dict(
            week=self.week_index, plan_need=need, plan_want=want, plan_save=save,
            income=0, need=0, want=0, save=0, deposits=0, planned_save=0,
            min_piggy=self.piggy, samples=0, ok_samples=0, wishes=0, saved_this_week=False,
        )
        self.earn(t, self.e["allowance_weekly"], "allowance", "Карманные деньги")

        # Взрослый может дать задания на этой неделе
        self.parent_tasks = []
        if self.rng.random() < self.profile.parent_engagement:
            cap = self.e["parent_task"]
            for _ in range(self.rng.randint(1, cap["max_per_week"])):
                due = t + timedelta(days=self.rng.randint(0, 6), hours=self.rng.randint(15, 19))
                self.parent_tasks.append((due, self.rng.choice([5, 10, 15, cap["max_reward"]])))

    def week_end_nudge(self, t: datetime) -> None:
        """Итоги недели: питомец предлагает положить остаток кошелька в копилку.

        Ребёнок соглашается тем охотнее, чем лучше освоил навыки накоплений
        и чем ближе ему такая стратегия (у «транжиры» — редко).
        """
        nudge = self.e.get("week_end_nudge", {})
        if not nudge.get("enabled") or self.wallet <= 0:
            return
        p_accept = (0.3 + 0.6 * self.savings_skill()) * self.strategy["nudge_accept"]
        if self.rng.random() < p_accept:
            self.deposit(t, self.wallet)

    def close_week(self) -> None:
        w = self.week
        income = max(1, w["income"])
        fact = {"need": w["need"] / income, "want": w["want"] / income, "save": w["save"] / income}
        plan = {"need": w["plan_need"] / 100, "want": w["plan_want"] / 100, "save": w["plan_save"] / 100}
        deviation = 0.5 * sum(abs(fact[k] - plan[k]) for k in plan)
        want_budget = plan["want"] * income
        self.weekly_rows.append(
            dict(
                child_id=self.profile.child_id,
                persona=self.profile.persona,
                money_strategy=self.profile.money_strategy,
                **{k: w[k] for k in ("week", "plan_need", "plan_want", "plan_save", "income", "need", "want", "save", "wishes")},
                wallet_end=self.wallet,
                piggy_end=self.piggy,
                goals_done=len(self.goals_done),
                K1_plan=round(1 - min(1.0, deviation), 4),
                K2_regular_saving=1 if w["deposits"] > 0 else 0,
                K3_pet_care=round(w["ok_samples"] / w["samples"], 4) if w["samples"] else 1.0,
                K4_restraint=round(1 - min(1.0, max(0.0, w["want"] - want_budget) / income), 4),
                K5_goal_progress=round(min(1.0, w["save"] / w["planned_save"]), 4) if w["planned_save"] else 0.0,
            )
        )

    # ---------- решения ребёнка во время визита ----------

    def visit(self, t: datetime, follow_plan: bool) -> None:
        """Что ребёнок делает с деньгами, зайдя в игру."""
        self.advance(t)
        for due, reward in [x for x in self.parent_tasks if x[0] <= t]:
            self.parent_tasks.remove((due, reward))
            if self.rng.random() < 0.7:
                self.earn(t, reward, "parent_reward", "Задание от взрослого")
        self.feed(t)
        if not self.week["saved_this_week"]:
            self.plan_saving(t, follow_plan)
        self.buy_wants(t, follow_plan)
        if self.strategy["save_leftover"] and t.weekday() == 6:
            self.deposit(t, self.wallet - NEED_PER_DAY)
        self.try_goal(t)

    def feed(self, t: datetime) -> None:
        if self.wish_pending:
            treats = [self.food_by_id[i] for i in self.e["special_treats"]]
            affordable = [f for f in treats if f["price"] <= self.wallet]
            if affordable:
                treat = min(affordable, key=lambda f: f["price"])
                self.spend(t, treat["price"], "food", "need", treat["id"], f"Особое угощение: {treat['name']}")
                self._eat(t, treat)
                self.wish_pending = False
        if self.hunger >= self.strategy["feed_below"]:
            return
        while self.hunger < FOOD_TARGET:
            options = [f for f in self.foods if f["price"] <= self.wallet]
            if self.strategy["food"] == "cheap":
                options = [f for f in options if f["necessity"] == "need"]
                food = min(options, key=lambda f: f["price"] / f["nutrition"]) if options else None
            else:
                tasty = [f for f in options if f["price"] >= 11]
                food = self.rng.choice(tasty or options) if (tasty or options) else None
            if food is None:
                return  # денег нет: питомец подождёт понедельника или наград за уроки
            self.spend(t, food["price"], "food", food["necessity"], food["id"], food["name"])
            self._eat(t, food)

    def _eat(self, t: datetime, food: dict) -> None:
        self.hunger = min(float(self.h["max"]), self.hunger + food["nutrition"])
        if self.hunger >= self.h["very_hungry_below"]:
            self.very_hungry_since = None
        if self.fed_on is None or self.fed_on.date() != t.date():
            self.fed_on = t
            self.earn(t, self.e["feeding_bonus"], "task_reward", "Покормил Финни")

    def plan_saving(self, t: datetime, follow_plan: bool) -> None:
        planned = round(self.week["plan_save"] / 100 * self.e["allowance_weekly"])
        self.week["planned_save"] = planned
        self.week["saved_this_week"] = True
        if planned and follow_plan:
            self.deposit(t, planned)

    def buy_wants(self, t: datetime, follow_plan: bool) -> None:
        wants = [
            dict(id=h["id"], name=h["name"], price=h["price"], kind="wardrobe")
            for h in self.e["wardrobe"]
            if h["id"] not in self.owned_hats
        ] + [dict(id=f["id"], name=f["name"], price=f["price"], kind="food") for f in self.foods if f["necessity"] == "want"]

        days_left = 7 - t.weekday()
        reserve = NEED_PER_DAY * days_left
        budget_left = self.week["plan_want"] / 100 * max(self.week["income"], self.e["allowance_weekly"]) - self.week["want"]

        if self.rng.random() < self.strategy["impulsive"]:
            pool = [w for w in wants if w["price"] <= self.wallet]  # импульс: ни бюджета, ни запаса
        elif follow_plan and self.rng.random() < 0.5:
            pool = [w for w in wants if w["price"] <= budget_left and w["price"] <= self.wallet - reserve]
        else:
            return
        if not pool:
            return
        item = max(pool, key=lambda w: w["price"]) if self.rng.random() < 0.5 else self.rng.choice(pool)
        self.spend(t, item["price"], item["kind"], "want", item["id"], item["name"])
        if item["kind"] == "wardrobe":
            self.owned_hats.add(item["id"])

    def try_goal(self, t: datetime) -> None:
        if self.piggy < self.goal["target"]:
            return
        self.piggy -= self.goal["target"]
        self._tx(t, "piggy", -self.goal["target"], "goal_purchase", "save", self.goal["id"], self.goal["name"])
        self._track_piggy()
        self.goals_done.append(self.goal["id"])
        order = ["small", "small", "medium", "medium", "large"]
        size = order[min(len(self.goals_done) - 1, len(order) - 1)]
        self.goal = self.rng.choice([g for g in self.e["goals"] if g["size"] == size])

    # ---------- награды за учёбу ----------

    def lesson_reward(self, t: datetime, first_attempt_accuracy: float) -> None:
        r = self.e["lesson_reward"]
        amount = r["base"] + round(r["accuracy_bonus"] * first_attempt_accuracy)
        if self.very_hungry():
            amount = math.floor(amount * r["hungry_multiplier"])
        self.earn(t, amount, "lesson_reward", "Награда за урок")

    def chapter_reward(self, t: datetime) -> None:
        self.earn(t, self.e["chapter_reward"], "chapter_reward", "Награда за главу")

    def daily_row(self, t: datetime) -> dict:
        return dict(
            child_id=self.profile.child_id,
            date=t.date().isoformat(),
            week=self.week_index,
            hunger=round(self.hunger, 1),
            very_hungry=self.very_hungry(),
            wish_pending=self.wish_pending,
            wallet=self.wallet,
            piggy=self.piggy,
            goal=self.goal["id"],
            goals_done=len(self.goals_done),
        )
