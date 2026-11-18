# Сервер Finny

FastAPI + PostgreSQL, запускаются через Docker Compose.

## Запуск

Из папки `finny` (там, где лежит `docker-compose.yml`):

```
docker compose up --build
```

Первый запуск занимает несколько минут: скачиваются образы и ставятся библиотеки.

Проверка:
- http://localhost:8000/health — сервер отвечает
- http://localhost:8000/health/db — сервер видит базу
- http://localhost:8000/docs — автоматическая документация API (Swagger)

## Остановка

- `Ctrl+C` в окне, где запущен сервер, или `docker compose down`
- `docker compose down -v` — остановить **и удалить данные базы** (начать с чистого листа)

## Что где лежит

| Файл | Зачем |
|---|---|
| `docker-compose.yml` | какие контейнеры запускать и как они связаны |
| `server/Dockerfile` | как собрать образ сервера |
| `server/requirements.txt` | Python-библиотеки сервера |
| `server/app/main.py` | эндпоинты API |
| `server/app/db.py` | подключение к PostgreSQL |
| `server/app/models/` | описание таблиц базы (SQLAlchemy) |
| `server/migrations/` | миграции Alembic: история изменений структуры базы |

Код в `server/` подключён в контейнер напрямую: после сохранения файла сервер перезапускается сам, пересобирать ничего не надо. Пересобирать (`--build`) нужно только после изменения `requirements.txt` или `Dockerfile`.

## Миграции (изменение структуры базы)

Сервер должен быть запущен. Во втором окне PowerShell, из папки `finny`:

1. Поменяла модели в `server/app/models/` → создать миграцию:
   ```
   docker compose exec api alembic revision --autogenerate -m "что изменилось"
   ```
   В `server/migrations/versions/` появится новый файл — его стоит открыть и проверить глазами.
2. Применить миграции к базе:
   ```
   docker compose exec api alembic upgrade head
   ```
3. Посмотреть таблицы:
   ```
   docker compose exec db psql -U finny -c "\dt"
   ```

Откатить последнюю миграцию: `docker compose exec api alembic downgrade -1`.
