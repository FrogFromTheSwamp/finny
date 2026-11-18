"""Тесты регистрации и входа: родитель и ребёнок."""
from tests.helpers import auth, register_child, register_parent


# ---------- Ребёнок ----------

def test_child_register_creates_profile(client):
    data = register_child(client, pet_name="Пушок")

    assert data["device_token"] and data["access_token"]
    me = client.get("/children/me", headers=auth(data["access_token"]))
    assert me.status_code == 200
    assert me.json()["pet_name"] == "Пушок"
    assert me.json()["timezone"] == "Europe/Moscow"


def test_child_gets_new_access_token_by_device_token(client):
    data = register_child(client)

    response = client.post("/auth/children/token", json={"device_token": data["device_token"]})
    assert response.status_code == 200
    me = client.get("/children/me", headers=auth(response.json()["access_token"]))
    assert me.status_code == 200


def test_unknown_device_token_rejected(client):
    response = client.post("/auth/children/token", json={"device_token": "not-a-real-token"})
    assert response.status_code == 401


# ---------- Родитель ----------

def test_parent_register_and_login(client):
    register_parent(client, email="mama@test.ru", password="password123")

    response = client.post(
        "/auth/parents/login", json={"email": "mama@test.ru", "password": "password123"}
    )
    assert response.status_code == 200
    me = client.get("/parents/me", headers=auth(response.json()["access_token"]))
    assert me.status_code == 200
    assert me.json()["email"] == "mama@test.ru"
    assert me.json()["children"] == []


def test_duplicate_email_rejected_case_insensitive(client):
    register_parent(client, email="mama@test.ru")

    response = client.post(
        "/auth/parents/register",
        json={"email": "MAMA@test.ru", "password": "password123", "name": "Мама 2"},
    )
    assert response.status_code == 409


def test_short_password_rejected(client):
    response = client.post(
        "/auth/parents/register", json={"email": "a@test.ru", "password": "123", "name": "А"}
    )
    assert response.status_code == 422


def test_wrong_password_and_unknown_email_give_same_error(client):
    register_parent(client, email="mama@test.ru", password="password123")

    wrong_password = client.post(
        "/auth/parents/login", json={"email": "mama@test.ru", "password": "wrong-password"}
    )
    unknown_email = client.post(
        "/auth/parents/login", json={"email": "nobody@test.ru", "password": "password123"}
    )
    assert wrong_password.status_code == unknown_email.status_code == 401
    # Одинаковый текст: по ответу нельзя узнать, зарегистрирована ли почта
    assert wrong_password.json() == unknown_email.json()


def test_password_is_not_stored_in_plain_text(client):
    from sqlalchemy import select

    from app.db import SessionLocal
    from app.models import User

    register_parent(client, email="mama@test.ru", password="password123")
    with SessionLocal() as db:
        stored = db.scalar(select(User.password_hash).where(User.email == "mama@test.ru"))
    assert "password123" not in stored
    assert stored.startswith("$argon2")


# ---------- Refresh и выход ----------

def test_refresh_rotates_token(client):
    tokens = register_parent(client)

    first = client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert first.status_code == 200
    assert first.json()["refresh_token"] != tokens["refresh_token"]

    # Старый refresh уже отозван: повторно его использовать нельзя
    reused = client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert reused.status_code == 401


def test_logout_revokes_refresh_token(client):
    tokens = register_parent(client)

    assert client.post("/auth/logout", json={"refresh_token": tokens["refresh_token"]}).status_code == 204
    response = client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert response.status_code == 401


# ---------- Роли и токены ----------

def test_no_token_gives_401(client):
    assert client.get("/parents/me").status_code == 401
    assert client.get("/children/me").status_code == 401


def test_garbage_token_gives_401(client):
    assert client.get("/parents/me", headers=auth("garbage")).status_code == 401


def test_child_token_cannot_access_parent_endpoints(client):
    child = register_child(client)
    assert client.get("/parents/me", headers=auth(child["access_token"])).status_code == 403


def test_parent_token_cannot_access_child_endpoints(client):
    parent = register_parent(client)
    response = client.post("/children/me/link-code", headers=auth(parent["access_token"]))
    assert response.status_code == 403
