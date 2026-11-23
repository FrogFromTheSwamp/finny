"""Пересчёт mastery из сохранённого журнала; по одной транзакции на ребёнка."""
import uuid
from itertools import groupby

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.bkt import bkt_step
from app.db import SessionLocal
from app.import_bkt_params import active_params
from app.models import Child, LearningEvent, Mastery

# Дубли первой попытки остаются в журнале. При совпадении received_at порядок
# внутри пачки задают device_seq и UUID. Версия задания берётся у выбранной записи.
STEPS = text("""
    WITH first_answers AS (
        SELECT DISTINCT ON (session_id, task_id)
               session_id, task_id, task_version, occurred_at, device_seq, is_correct
        FROM learning_events
        WHERE child_id = :child AND session_id IS NOT NULL
          AND attempt_no = 1 AND is_correct IS NOT NULL
        ORDER BY session_id, task_id, received_at, device_seq NULLS LAST, id
    )
    SELECT t.competency_id AS skill, e.session_id, e.occurred_at,
           count(*) FILTER (WHERE e.is_correct) AS correct,
           count(*) FILTER (WHERE NOT e.is_correct) AS wrong
    FROM first_answers e JOIN tasks t ON (t.id, t.version) = (e.task_id, e.task_version)
    WHERE CAST(:skills AS varchar[]) IS NULL OR t.competency_id = ANY(CAST(:skills AS varchar[]))
    GROUP BY t.competency_id, e.session_id, e.occurred_at
    ORDER BY t.competency_id, e.occurred_at, min(e.device_seq) NULLS LAST, e.session_id
""")


def rebuild_child(db: Session, child_id: uuid.UUID, skills: set[str] | None = None) -> int:
    """Перечитать историю выбранных навыков (по умолчанию всех) под блокировкой ребёнка."""
    db.execute(select(Child.id).where(Child.id == child_id).with_for_update()).scalar_one()
    rows = db.execute(STEPS, {"child": child_id, "skills": sorted(skills) if skills is not None else None}).mappings()
    changed = 0
    for skill, history in groupby(rows, key=lambda row: row["skill"]):
        params = active_params(db, skill)
        mastery = params.p_init
        attempts = 0
        for step in history:
            mastery = bkt_step(mastery, correct=step["correct"], wrong=step["wrong"],
                               p_learn=params.p_learn, p_guess=params.p_guess, p_slip=params.p_slip).p_mastery
            attempts += step["correct"] + step["wrong"]
        cached = db.get(Mastery, (child_id, skill))
        values = (mastery, attempts, params.model_version)
        if cached is None:
            cached = Mastery(child_id=child_id, competency_id=skill)
            db.add(cached)
        elif (cached.p_mastery, cached.attempts, cached.model_version) == values:
            continue
        cached.p_mastery, cached.attempts, cached.model_version = values
        changed += 1
    return changed


def rebuild_all() -> tuple[int, int]:
    """Повторяемая команда для исторических ответов и смены активной модели."""
    with SessionLocal() as db:
        children = db.scalars(select(LearningEvent.child_id).distinct().order_by(LearningEvent.child_id)).all()
    changed = 0
    for child_id in children:
        with SessionLocal.begin() as db:
            changed += rebuild_child(db, child_id)
    return len(children), changed


if __name__ == "__main__":
    count, changed = rebuild_all()
    print(f"Обработано детей: {count}; обновлено строк mastery: {changed}")

