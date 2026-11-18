"""Загрузка компетенций и графа навыков из content/competencies.json в базу.

Запуск (сервер должен работать):
    docker compose exec api python -m app.seed_content

Скрипт можно запускать сколько угодно раз: существующие компетенции
обновляются, рёбра графа пересоздаются заново. Всё в одной транзакции —
если что-то пошло не так, база останется как была.
"""
import json
import os
from pathlib import Path

from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.db import engine
from app.models import Competency, CompetencyPrereq

CONTENT_DIR = Path(os.environ.get("CONTENT_DIR", "/content"))


def check_graph(graph: dict[str, list[str]]) -> None:
    """Проверить, что все ссылки существуют и в графе нет циклов.

    Обход в глубину с тремя «цветами»: белый — не посещали,
    серый — сейчас на пути обхода, чёрный — полностью обработан.
    Встретили серую вершину — значит, вернулись по кругу: цикл.
    """
    white, gray, black = 0, 1, 2
    color = {node: white for node in graph}

    def visit(node: str, path: list[str]) -> None:
        color[node] = gray
        for required in graph[node]:
            if required not in graph:
                raise ValueError(f"{node} требует неизвестный навык {required}")
            if color[required] == gray:
                cycle = " -> ".join(path + [node, required])
                raise ValueError(f"Цикл в графе навыков: {cycle}")
            if color[required] == white:
                visit(required, path + [node])
        color[node] = black

    for node in graph:
        if color[node] == white:
            visit(node, [])


def main() -> None:
    path = CONTENT_DIR / "competencies.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    items = data["competencies"]

    graph = {c["id"]: c["requires"] for c in items}
    check_graph(graph)

    rows = [
        {
            "id": c["id"],
            "title": c["title"],
            "area": c["area"],
            "topic": c["topic"],
            "category": c["category"],
            "level": c["level"],
            "framework_text": c["framework_text"],
            "age_min": 7,
            "age_max": 11,
        }
        for c in items
    ]
    edges = [
        {"competency_id": node, "requires_id": required}
        for node, requirements in graph.items()
        for required in requirements
    ]

    with Session(engine) as session, session.begin():
        # INSERT ... ON CONFLICT DO UPDATE: новая — вставить, существующая — обновить
        stmt = insert(Competency).values(rows)
        update_cols = {key: stmt.excluded[key] for key in rows[0] if key != "id"}
        update_cols["updated_at"] = func.now()
        session.execute(
            stmt.on_conflict_do_update(index_elements=["id"], set_=update_cols)
        )

        session.execute(delete(CompetencyPrereq))
        if edges:
            session.execute(insert(CompetencyPrereq).values(edges))

        in_db = set(session.scalars(select(Competency.id)))
        extra = in_db - set(graph)

    print(f"Компетенций загружено: {len(rows)}, рёбер графа: {len(edges)}")
    if extra:
        print(f"Внимание: в базе есть компетенции, которых нет в JSON: {sorted(extra)}")


if __name__ == "__main__":
    main()
