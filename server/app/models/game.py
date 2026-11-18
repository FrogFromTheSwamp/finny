"""Игра и деньги: состояние питомца, бюджет, операции, цели, задания родителя."""
import uuid
from datetime import date, datetime

from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, SoftDeleteMixin, TimestampMixin, new_uuid, one_of


class GameState(TimestampMixin, Base):
    """Текущее состояние игры ребёнка (одна строка на ребёнка).

    coins — КЭШ: правда о деньгах хранится в transactions,
    сервер пересчитывает и сверяет.
    version — для оптимистичной блокировки: изменение принимается,
    только если клиент прислал актуальную версию.
    """

    __tablename__ = "game_states"

    child_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("children.id"), primary_key=True)
    coins: Mapped[int] = mapped_column(default=0)
    xp: Mapped[int] = mapped_column(default=0)
    level: Mapped[int] = mapped_column(default=1)
    hunger: Mapped[int] = mapped_column(default=58)
    streak_days: Mapped[int] = mapped_column(default=0)
    last_daily_reward_on: Mapped[date | None] = mapped_column()
    # «Косметика», которую не анализируем: инвентарь, шапки, шаг туториала
    extras: Mapped[dict] = mapped_column(server_default=text("'{}'::jsonb"))
    version: Mapped[int] = mapped_column(default=1)


class BudgetPeriod(TimestampMixin, Base):
    """План бюджета на календарную неделю (в процентах).

    Факт не хранится: это сумма transactions за неделю.
    """

    __tablename__ = "budget_periods"
    __table_args__ = (
        UniqueConstraint("child_id", "start_date"),  # одна неделя — одна строка
        CheckConstraint("plan_need + plan_want + plan_save = 100", name="plan_sum_100"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=new_uuid)
    child_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("children.id"))
    start_date: Mapped[date] = mapped_column()  # понедельник
    plan_need: Mapped[int] = mapped_column()
    plan_want: Mapped[int] = mapped_column()
    plan_save: Mapped[int] = mapped_column()


class Goal(TimestampMixin, SoftDeleteMixin, Base):
    """Цель накопления. Сколько накоплено — сумма операций с этим goal_id."""

    __tablename__ = "goals"
    __table_args__ = (
        one_of("status", ["active", "completed", "cancelled"]),
        CheckConstraint("target > 0", name="target_positive"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=new_uuid)  # создаёт телефон
    child_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("children.id"), index=True)
    template_id: Mapped[str | None] = mapped_column(String(40))
    title: Mapped[str] = mapped_column(String(100))
    target: Mapped[int] = mapped_column()
    deadline: Mapped[date | None] = mapped_column()
    status: Mapped[str] = mapped_column(String(20), default="active")
    completed_at: Mapped[datetime | None] = mapped_column()


class ParentTask(TimestampMixin, SoftDeleteMixin, Base):
    """Дополнительное задание от родителя («помой посуду — 10 монет»)."""

    __tablename__ = "parent_tasks"
    __table_args__ = (
        one_of("status", ["assigned", "submitted", "approved", "rejected"]),
        CheckConstraint("reward >= 0", name="reward_non_negative"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=new_uuid)
    parent_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    child_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("children.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    reward: Mapped[int] = mapped_column()
    due_date: Mapped[date | None] = mapped_column()
    status: Mapped[str] = mapped_column(String(20), default="assigned")
    approved_at: Mapped[datetime | None] = mapped_column()


class Transaction(Base):
    """Денежная операция. ЖУРНАЛ: строки только добавляются, не меняются.

    id создаёт телефон — повторная отправка того же id не создаёт дубль.
    amount > 0 — пришло, amount < 0 — потрачено.
    """

    __tablename__ = "transactions"
    __table_args__ = (
        one_of(
            "kind",
            [
                "food", "wardrobe", "daily_reward", "lesson_reward",
                "chapter_reward", "task_reward", "parent_reward",
                "goal_deposit", "goal_withdraw", "goal_purchase", "other",
            ],
        ),
        CheckConstraint(
            "necessity IS NULL OR necessity IN ('need', 'want', 'save')",
            name="necessity_allowed",
        ),
        CheckConstraint("amount <> 0", name="amount_non_zero"),
        Index("ix_transactions_child_occurred", "child_id", "occurred_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    child_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("children.id"))
    device_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("devices.id"))
    amount: Mapped[int] = mapped_column()
    kind: Mapped[str] = mapped_column(String(20))
    necessity: Mapped[str | None] = mapped_column(String(10))  # нужное / желаемое / накопление
    title: Mapped[str] = mapped_column(String(100))
    goal_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("goals.id"), index=True)
    parent_task_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("parent_tasks.id"))
    occurred_at: Mapped[datetime] = mapped_column()  # по часам телефона
    received_at: Mapped[datetime] = mapped_column(server_default=func.now())  # по часам сервера
