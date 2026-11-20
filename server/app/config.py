"""Настройки сервера. Секреты берутся из переменных окружения (docker-compose.yml / .env)."""
import os

# Ключ подписи JWT. В разработке есть значение по умолчанию,
# на настоящем сервере его ОБЯЗАТЕЛЬНО задают через .env.
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-secret-key-change-me-on-real-server")
JWT_ALGORITHM = "HS256"

ACCESS_TOKEN_TTL_MINUTES = 30  # короткоживущий токен для запросов
REFRESH_TOKEN_TTL_DAYS = 30  # долгоживущий токен родителя для обновления

LINK_CODE_TTL_MINUTES = 15  # сколько живёт код привязки
LINK_MAX_FAILED_ATTEMPTS = 5  # неверных попыток ввода кода...
LINK_FAILED_WINDOW_MINUTES = 15  # ...за столько минут

# Каким сайтам браузер разрешит обращаться к API (CORS).
# Нужно для веб-версии приложения: она открыта на другом порту (8081).
# В разработке разрешаем всем; на настоящем сервере — только своему домену.
CORS_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",") if o.strip()]
