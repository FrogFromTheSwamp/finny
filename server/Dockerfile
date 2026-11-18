# Образ сервера Finny: Python + зависимости + код API
FROM python:3.13-slim

WORKDIR /code

# Сначала ставим зависимости (этот слой кэшируется и не пересобирается без нужды)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Затем копируем сам код и миграции
COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
