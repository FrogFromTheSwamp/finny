"""Импорт итоговой подгонки v4 из JSON на stdin. Вся активация — одна транзакция."""
import hashlib
import json
import sys

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.bkt import bkt_step
from app.db import SessionLocal
from app.models import BktParams, Competency

VERSION = "bkt-sim-v3-v2"
DEFAULT_VERSION = "bkt-default-v1"
FIELDS = ("p_init", "p_learn", "p_guess", "p_slip")
DEFAULT_PARAMS = dict(zip(FIELDS, (0.2, 0.1, 0.25, 0.15)))
BOUNDS = {"guess_max": 0.499, "slip_max": 0.499, "learn_max": 0.5}
RULE = "minimum learn_max with pooled validation RMSE <= best validation RMSE + 0.0005"


def errors_raise_mastery(p_init: float, p_learn: float, p_guess: float, p_slip: float) -> bool:
    """Три отдельных ошибочных ответа повысили освоение более чем на 0,2."""
    mastery = p_init
    for _ in range(3):
        mastery = bkt_step(mastery, correct=0, wrong=1, p_learn=p_learn,
                           p_guess=p_guess, p_slip=p_slip).p_mastery
    return mastery - p_init > 0.2


def _fill_error_flag(row: BktParams, flag: bool) -> bool:
    """Дополнить старую строку, проверив уже записанное значение при повторе."""
    if "errors_raise_mastery" in row.metrics:
        if row.metrics["errors_raise_mastery"] is not flag:
            raise ValueError(f"{row.competency_id}: конфликт метаданных версии {row.model_version}")
        return False
    row.metrics = {**row.metrics, "errors_raise_mastery": flag}
    return True


def import_params(db: Session, raw: bytes) -> int:
    """Вернуть число добавленных или обновлённых строк, включая заполнение флага."""
    artifact = json.loads(raw.decode("utf-8-sig"))
    final = artifact["test"]
    if (artifact["model_version"] != VERSION or artifact["source"] != "synthetic"
            or artifact["dataset"] != "sim_v3" or artifact["selection_rule"] != RULE
            or artifact["selected_bounds"] != BOUNDS or final["bounds"] != BOUNDS):
        raise ValueError("Ожидался итоговый артефакт v4 с потолком p_learn=0.5")
    groups = artifact["children"]
    train_ids = groups["train"] + groups["validation"]
    if len(train_ids) != 240 or len(set(train_ids)) != 240 or set(train_ids).intersection(groups["test"]):
        raise ValueError("Итоговая подгонка должна использовать 240 обучающих детей")
    skills = final["by_skill"]
    if len(skills) != 11 or set(skills) != set(final["mastery_table"]):
        raise ValueError("Неполный набор навыков итоговой подгонки")
    # Тот же порядок блокировок, что у пересчёта: импорты не конкурируют за активную версию.
    locked = db.scalars(select(Competency.id).where(Competency.id.in_(skills))
                        .order_by(Competency.id).with_for_update()).all()
    if set(locked) != set(skills):
        raise ValueError(f"Неизвестные навыки: {sorted(set(skills) - set(locked))}")
    digest = hashlib.sha256(raw).hexdigest()
    changes = 0
    for skill in locked:
        row = skills[skill]
        params = row["parameters"]
        if set(params) != set(FIELDS) or any(type(p) not in (float, int) or not 0 < p < 1
                                             for p in params.values()):
            raise ValueError(f"{skill}: каждый параметр должен быть строго внутри (0, 1)")
        limits = {}
        for name, high in zip(FIELDS, (0.999, 0.5, 0.499, 0.499)):
            value = params[name]
            if not 0.001 <= value <= high:
                raise ValueError(f"{skill}: {name} вне границ выбранной модели")
            if abs(value - 0.001) <= 1e-7:
                limits[name] = "lower"
            elif abs(value - high) <= 1e-7:
                limits[name] = "upper"
        if limits != row["at_limit"]:
            raise ValueError(f"{skill}: отметки границ не соответствуют параметрам")
        metadata = {**row["metrics"], "source": "synthetic", "dataset": "sim_v3",
                    "artifact": "knowledge_models_v4_plearn.json", "artifact_sha256": digest,
                    "events_sha256": artifact["events_sha256"], "refit_children": 240,
                    "p_learn_cap": BOUNDS["learn_max"], "selection_rule": RULE,
                    "at_limit": sorted(limits), "reliable": not limits,
                    "errors_raise_mastery": errors_raise_mastery(**params)}
        fallback = db.get(BktParams, (skill, DEFAULT_VERSION))
        if fallback is not None:
            changes += _fill_error_flag(fallback, errors_raise_mastery(
                **{name: getattr(fallback, name) for name in FIELDS}))
        key = (skill, VERSION)
        existing = db.get(BktParams, key)
        if existing is not None:
            if any(getattr(existing, name) != params[name] for name in FIELDS):
                raise ValueError(f"{skill}: конфликт параметров версии {VERSION}")
            filled = _fill_error_flag(existing, metadata["errors_raise_mastery"])
            # Сохраняем хеш первого файла при повторе того же JSON с иным форматированием.
            if existing.metrics != {**metadata, "artifact_sha256": existing.metrics.get("artifact_sha256")}:
                raise ValueError(f"{skill}: конфликт метаданных версии {VERSION}")
            if existing.is_active:
                changes += filled
                continue
        db.execute(update(BktParams).where(BktParams.competency_id == skill, BktParams.is_active)
                   .values(is_active=False))
        if existing is None:
            db.add(BktParams(competency_id=skill, model_version=VERSION, metrics=metadata,
                             is_active=True, **params))
        else:
            existing.is_active = True
        changes += 1
    return changes


def active_params(db: Session, skill: str) -> BktParams:
    """Найти активную версию; при отсутствии зарегистрировать явно маркированный резерв."""
    db.execute(select(Competency.id).where(Competency.id == skill).with_for_update()).scalar_one()
    active = db.scalar(select(BktParams).where(BktParams.competency_id == skill, BktParams.is_active))
    if active is not None:
        return active
    fallback = db.get(BktParams, (skill, DEFAULT_VERSION))
    if fallback is None:
        fallback = BktParams(competency_id=skill, model_version=DEFAULT_VERSION, **DEFAULT_PARAMS,
                             metrics={"source": "fallback", "dataset": None, "p_learn_cap": None,
                                      "selection_rule": "no active parameters", "at_limit": [], "reliable": False,
                                      "errors_raise_mastery": errors_raise_mastery(**DEFAULT_PARAMS)})
        db.add(fallback)
    fallback.is_active = True
    return fallback


if __name__ == "__main__":
    try:
        with SessionLocal.begin() as db:
            activated = import_params(db, sys.stdin.buffer.read())
    except (ValueError, KeyError, TypeError) as exc:
        sys.exit(f"Импорт отменён: {exc}")
    print(f"{VERSION}: добавлено или обновлено строк {activated}")

