"""Тесты привязки «ребёнок — родитель» по коду."""
from datetime import timedelta

from sqlalchemy import update

from app.db import SessionLocal
from app.models import LinkCode
from app.security import now_utc
from tests.helpers import auth, get_link_code, register_child, register_parent


def test_full_linking_flow(client):
    child = register_child(client, pet_name="Финни")
    code = get_link_code(client, child["access_token"])
    parent = register_parent(client)

    response = client.post(
        "/family/link", json={"code": code, "consent": True}, headers=auth(parent["access_token"])
    )
    assert response.status_code == 200
    assert response.json()["pet_name"] == "Финни"

    me = client.get("/parents/me", headers=auth(parent["access_token"])).json()
    assert [c["id"] for c in me["children"]] == [child["child_id"]]


def test_code_is_single_use(client):
    child = register_child(client)
    code = get_link_code(client, child["access_token"])
    first_parent = register_parent(client, email="mama@test.ru")
    second_parent = register_parent(client, email="papa@test.ru")

    body = {"code": code, "consent": True}
    assert client.post("/family/link", json=body, headers=auth(first_parent["access_token"])).status_code == 200
    assert client.post("/family/link", json=body, headers=auth(second_parent["access_token"])).status_code == 404


def test_two_parents_can_link_one_child_with_separate_codes(client):
    child = register_child(client)
    mama = register_parent(client, email="mama@test.ru")
    papa = register_parent(client, email="papa@test.ru")

    for parent in (mama, papa):
        code = get_link_code(client, child["access_token"])
        response = client.post(
            "/family/link", json={"code": code, "consent": True}, headers=auth(parent["access_token"])
        )
        assert response.status_code == 200

    for parent in (mama, papa):
        children = client.get("/parents/me", headers=auth(parent["access_token"])).json()["children"]
        assert len(children) == 1


def test_link_requires_consent(client):
    child = register_child(client)
    code = get_link_code(client, child["access_token"])
    parent = register_parent(client)

    response = client.post(
        "/family/link", json={"code": code, "consent": False}, headers=auth(parent["access_token"])
    )
    assert response.status_code == 400


def test_new_code_invalidates_previous(client):
    child = register_child(client)
    old_code = get_link_code(client, child["access_token"])
    new_code = get_link_code(client, child["access_token"])
    parent = register_parent(client)
    headers = auth(parent["access_token"])

    if old_code != new_code:  # совпасть могут с вероятностью 1 на миллион
        assert client.post("/family/link", json={"code": old_code, "consent": True}, headers=headers).status_code == 404
    assert client.post("/family/link", json={"code": new_code, "consent": True}, headers=headers).status_code == 200


def test_expired_code_rejected(client):
    child = register_child(client)
    code = get_link_code(client, child["access_token"])
    with SessionLocal() as db:  # «перематываем время»: код истёк минуту назад
        db.execute(update(LinkCode).values(expires_at=now_utc() - timedelta(minutes=1)))
        db.commit()
    parent = register_parent(client)

    response = client.post(
        "/family/link", json={"code": code, "consent": True}, headers=auth(parent["access_token"])
    )
    assert response.status_code == 404


def test_code_must_be_six_digits(client):
    parent = register_parent(client)
    response = client.post(
        "/family/link", json={"code": "12ab", "consent": True}, headers=auth(parent["access_token"])
    )
    assert response.status_code == 422


def test_too_many_wrong_codes_blocked(client):
    parent = register_parent(client)
    headers = auth(parent["access_token"])
    body = {"code": "000000", "consent": True}

    for _ in range(5):
        assert client.post("/family/link", json=body, headers=headers).status_code == 404
    assert client.post("/family/link", json=body, headers=headers).status_code == 429
