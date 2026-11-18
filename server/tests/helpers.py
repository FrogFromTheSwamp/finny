"""Короткие функции, которые повторяются во многих тестах."""
from fastapi.testclient import TestClient


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def register_child(client: TestClient, pet_name: str = "Финни") -> dict:
    response = client.post("/auth/children/register", json={"pet_name": pet_name})
    assert response.status_code == 201, response.text
    return response.json()


def register_parent(
    client: TestClient, email: str = "parent@test.ru", password: str = "password123"
) -> dict:
    response = client.post(
        "/auth/parents/register", json={"email": email, "password": password, "name": "Мама"}
    )
    assert response.status_code == 201, response.text
    return response.json()


def get_link_code(client: TestClient, child_token: str) -> str:
    response = client.post("/children/me/link-code", headers=auth(child_token))
    assert response.status_code == 201, response.text
    return response.json()["code"]
