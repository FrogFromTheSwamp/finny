"""Все модели (таблицы) проекта.

Импорт здесь нужен, чтобы при `from app.models import Base`
все таблицы оказались зарегистрированы в Base.metadata — иначе
Alembic их «не увидит».
"""
from app.models.base import Base
from app.models.content import Competency, CompetencyPrereq, Lesson, Task
from app.models.game import BudgetPeriod, GameState, Goal, ParentTask, Transaction
from app.models.learning import (
    Assessment,
    BktParams,
    LearningEvent,
    LessonSession,
    Mastery,
    MasterySnapshot,
    Recommendation,
    SurveyResponse,
)
from app.models.people import Child, Device, FamilyLink, LinkCode, RefreshToken, User

__all__ = [
    "Base",
    "User", "Child", "Device", "RefreshToken", "FamilyLink", "LinkCode",
    "Competency", "CompetencyPrereq", "Lesson", "Task",
    "GameState", "BudgetPeriod", "Goal", "ParentTask", "Transaction",
    "Recommendation", "LessonSession", "LearningEvent", "Mastery",
    "MasterySnapshot", "BktParams", "Assessment", "SurveyResponse",
]
