"""Контент: компетенции, граф навыков, уроки, задания.

Это справочники: одинаковые для всех детей, загружаются из JSON-файлов.
"""
from sqlalchemy import CheckConstraint, ForeignKey, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, one_of


class Competency(TimestampMixin, Base):
    """Компетенция из Единой рамки финансовой грамотности."""

    __tablename__ = "competencies"
    __table_args__ = (
        one_of("category", ["knowledge", "skills", "attitudes"]),
        one_of("level", ["basic", "advanced"]),
    )

    id: Mapped[str] = mapped_column(String(20), primary_key=True)  # например "BUD-1"
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)

    # --- Ссылка на Единую рамку компетенций (2026) ---
    area: Mapped[str | None] = mapped_column(String(100))  # предметная область
    topic: Mapped[str | None] = mapped_column(String(200))  # тема внутри области
    # Колонка рамки: knowledge — осведомлённость и знания,
    # skills — умения и поведение, attitudes — личные характеристики
    category: Mapped[str] = mapped_column(String(20))
    level: Mapped[str] = mapped_column(String(20))  # basic / advanced
    framework_text: Mapped[str | None] = mapped_column(Text)  # точная формулировка из рамки
    age_min: Mapped[int | None] = mapped_column()
    age_max: Mapped[int | None] = mapped_column()


class CompetencyPrereq(Base):
    """Ребро графа навыков: competency_id требует освоения requires_id.

    Отсутствие циклов в графе проверяется при загрузке контента.
    """

    __tablename__ = "competency_prereqs"
    __table_args__ = (
        CheckConstraint("competency_id <> requires_id", name="no_self_loop"),
    )

    competency_id: Mapped[str] = mapped_column(ForeignKey("competencies.id"), primary_key=True)
    requires_id: Mapped[str] = mapped_column(ForeignKey("competencies.id"), primary_key=True)


class Lesson(TimestampMixin, Base):
    """Урок — фиксированная последовательность шагов внутри главы."""

    __tablename__ = "lessons"
    __table_args__ = (one_of("type", ["theory", "test", "repetition"]),)

    id: Mapped[str] = mapped_column(String(40), primary_key=True)  # "budget-2"
    chapter: Mapped[str] = mapped_column(String(30))  # budget / savings / payments
    number: Mapped[int] = mapped_column()
    title: Mapped[str] = mapped_column(String(200))
    type: Mapped[str] = mapped_column(String(20))


class Task(TimestampMixin, Base):
    """Задание = одно решение ребёнка внутри шага урока.

    Ключ составной: (id, version). Изменили задание — появилась новая
    версия, старая остаётся, и старые ответы продолжают ссылаться на неё.

    competency_id — это и есть Q-матрица в MVP: у каждого задания одна
    основная компетенция (многонавыковые задания — будущее расширение).
    """

    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    version: Mapped[int] = mapped_column(primary_key=True, default=1)
    lesson_id: Mapped[str | None] = mapped_column(ForeignKey("lessons.id"), index=True)
    competency_id: Mapped[str] = mapped_column(ForeignKey("competencies.id"), index=True)
    kind: Mapped[str] = mapped_column(String(30))  # swipe / shop / sort / pay ...
    difficulty: Mapped[int | None] = mapped_column()
    # Декларативный сценарий: текст, картинки, варианты и правильный ответ
    scenario: Mapped[dict] = mapped_column(server_default=text("'{}'::jsonb"))
    is_active: Mapped[bool] = mapped_column(default=True)
