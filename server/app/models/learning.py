"""Обучение и ML: сессии, журнал ответов, оценки освоения, параметры моделей,
рекомендации, входной/итоговый тесты и опросы."""
import uuid
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    String,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, new_uuid, one_of


class Recommendation(Base):
    """Что алгоритм подбора предложил ребёнку и почему.

    Рекомендуем тренировочный набор из 3–5 заданий на одну компетенцию.
    reason — объяснение для родителя («вероятность освоения 0.55, все
    предварительные навыки освоены»).
    reward — насколько удачным оказался выбор (заполняется после выполнения);
    нужен бандиту, чтобы учиться.
    """

    __tablename__ = "recommendations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=new_uuid)
    child_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("children.id"), index=True)
    competency_id: Mapped[str] = mapped_column(ForeignKey("competencies.id"))
    task_refs: Mapped[list] = mapped_column()  # [{"id": "...", "version": 1}, ...]
    policy: Mapped[str] = mapped_column(String(50))  # например "eps-greedy-0.1"
    reason: Mapped[dict] = mapped_column(server_default=text("'{}'::jsonb"))
    reward: Mapped[float | None] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column()


class LessonSession(TimestampMixin, Base):
    """Одно прохождение урока или тренировочного набора.

    Позволяет увидеть, где дети бросают урок (status = abandoned).
    """

    __tablename__ = "lesson_sessions"
    __table_args__ = (
        one_of("kind", ["lesson", "practice", "assessment"]),
        one_of("status", ["started", "completed", "abandoned"]),
        Index("ix_lesson_sessions_child_started", "child_id", "started_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True)  # создаёт телефон
    child_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("children.id"))
    device_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("devices.id"))
    kind: Mapped[str] = mapped_column(String(20))
    lesson_id: Mapped[str | None] = mapped_column(ForeignKey("lessons.id"))
    recommendation_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("recommendations.id"))
    status: Mapped[str] = mapped_column(String(20), default="started")
    started_at: Mapped[datetime] = mapped_column()
    finished_at: Mapped[datetime | None] = mapped_column()


class LearningEvent(Base):
    """ГЛАВНАЯ ТАБЛИЦА ДЛЯ ML: один ответ ребёнка на одно задание.

    Журнал: строки только добавляются.
    answer — что ответил ребёнок; is_correct считает СЕРВЕР по сценарию задания.
    device_seq — порядковый номер события на устройстве (на случай, если
    часы телефона врут и occurred_at не годится для сортировки).
    """

    __tablename__ = "learning_events"
    __table_args__ = (
        ForeignKeyConstraint(
            ["task_id", "task_version"], ["tasks.id", "tasks.version"],
            name="fk_learning_events_task",
        ),
        CheckConstraint("attempt_no >= 1", name="attempt_positive"),
        Index("ix_learning_events_child_occurred", "child_id", "occurred_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True)  # создаёт телефон
    child_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("children.id"))
    session_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("lesson_sessions.id"), index=True
    )
    device_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("devices.id"))
    device_seq: Mapped[int | None] = mapped_column(BigInteger)
    task_id: Mapped[str] = mapped_column(String(80))
    task_version: Mapped[int] = mapped_column()
    attempt_no: Mapped[int] = mapped_column(default=1)
    answer: Mapped[dict] = mapped_column()
    is_correct: Mapped[bool | None] = mapped_column()
    hint_used: Mapped[bool] = mapped_column(default=False)
    duration_ms: Mapped[int | None] = mapped_column()
    occurred_at: Mapped[datetime] = mapped_column()
    received_at: Mapped[datetime] = mapped_column(server_default=func.now())


class Mastery(Base):
    """Текущая вероятность освоения компетенции ребёнком (кэш BKT)."""

    __tablename__ = "mastery"
    __table_args__ = (
        CheckConstraint("p_mastery BETWEEN 0 AND 1", name="p_range"),
    )

    child_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("children.id"), primary_key=True)
    competency_id: Mapped[str] = mapped_column(ForeignKey("competencies.id"), primary_key=True)
    p_mastery: Mapped[float] = mapped_column()
    attempts: Mapped[int] = mapped_column(default=0)
    model_version: Mapped[str] = mapped_column(String(50))
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())


class MasterySnapshot(Base):
    """История освоения — для графика прогресса у родителя."""

    __tablename__ = "mastery_snapshots"
    __table_args__ = (
        Index("ix_mastery_snapshots_child_taken", "child_id", "taken_at"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    child_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("children.id"))
    competency_id: Mapped[str] = mapped_column(ForeignKey("competencies.id"))
    p_mastery: Mapped[float] = mapped_column()
    model_version: Mapped[str] = mapped_column(String(50))
    taken_at: Mapped[datetime] = mapped_column(server_default=func.now())


class BktParams(Base):
    """Обученные параметры BKT для компетенции.

    p_init — знал ли навык с самого начала, p_learn — шанс выучить за одну
    попытку, p_guess — угадать, не зная, p_slip — ошибиться, зная.
    Активна только одна версия на компетенцию.
    """

    __tablename__ = "bkt_params"
    __table_args__ = (
        Index(
            "uq_bkt_params_one_active", "competency_id",
            unique=True, postgresql_where=text("is_active"),
        ),
    )

    competency_id: Mapped[str] = mapped_column(ForeignKey("competencies.id"), primary_key=True)
    model_version: Mapped[str] = mapped_column(String(50), primary_key=True)
    p_init: Mapped[float] = mapped_column()
    p_learn: Mapped[float] = mapped_column()
    p_guess: Mapped[float] = mapped_column()
    p_slip: Mapped[float] = mapped_column()
    is_active: Mapped[bool] = mapped_column(default=False)
    metrics: Mapped[dict] = mapped_column(server_default=text("'{}'::jsonb"))  # AUC, RMSE
    trained_at: Mapped[datetime] = mapped_column(server_default=func.now())


class Assessment(Base):
    """Входной и итоговый тесты по финансовой грамотности (для пилота)."""

    __tablename__ = "assessments"
    __table_args__ = (one_of("kind", ["pre", "post"]),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=new_uuid)
    child_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("children.id"), index=True)
    kind: Mapped[str] = mapped_column(String(10))
    score: Mapped[int] = mapped_column()
    max_score: Mapped[int] = mapped_column()
    answers: Mapped[dict] = mapped_column(server_default=text("'{}'::jsonb"))
    taken_at: Mapped[datetime] = mapped_column(server_default=func.now())


class SurveyResponse(Base):
    """Ответы на опросы (SUS) — от родителя или ребёнка."""

    __tablename__ = "survey_responses"
    __table_args__ = (
        one_of("survey", ["sus"]),
        CheckConstraint(
            "(user_id IS NOT NULL) <> (child_id IS NOT NULL)",
            name="exactly_one_respondent",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=new_uuid)
    survey: Mapped[str] = mapped_column(String(20))
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    child_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("children.id"))
    answers: Mapped[dict] = mapped_column()
    score: Mapped[float | None] = mapped_column()
    taken_at: Mapped[datetime] = mapped_column(server_default=func.now())
