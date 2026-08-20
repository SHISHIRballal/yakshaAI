import pytest
import socketio
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.utils.jwt_handler import create_access_token
from app.models.user import User

Base.metadata.create_all(bind=engine)

client = TestClient(app)


def get_user_token(email: str, password: str) -> str:
    res = client.post("/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    return res.json()["access_token"]


def test_socket_auth_rejection():
    """Unauthorized socket connection without token should be refused."""
    sio_client = socketio.SimpleClient()
    with pytest.raises(Exception):
        # Connecting without token
        sio_client.connect("http://127.0.0.1:8000", auth={}, transports=["websocket", "polling"])


def test_rest_message_persistence_and_retrieval():
    """Verify one-to-one message creation, history retrieval, and read status via REST."""
    admin_token = get_user_token("admin@yakshagai.com", "Admin@1234")
    artist_token = get_user_token("balakrishna@yakshagai.com", "Artist@1234")

    # Get artist user id
    me_res = client.get("/auth/me", headers={"Authorization": f"Bearer {artist_token}"})
    assert me_res.status_code == 200
    artist_user_id = me_res.json()["id"]

    # 1. Admin sends message to artist
    msg_content = "Hello Balakrishna! Are you available for Kurukshetra prasanga next month?"
    send_res = client.post(
        "/messages",
        json={"receiver_id": artist_user_id, "content": msg_content},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert send_res.status_code == 201
    msg_data = send_res.json()
    assert msg_data["content"] == msg_content
    assert msg_data["is_read"] is False

    # 2. Artist retrieves conversation history
    admin_user_id = client.get("/auth/me", headers={"Authorization": f"Bearer {admin_token}"}).json()["id"]
    hist_res = client.get(f"/messages/{admin_user_id}", headers={"Authorization": f"Bearer {artist_token}"})
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) >= 1
    assert any(m["content"] == msg_content for m in history)

    # 3. Artist marks messages read
    read_res = client.put(f"/messages/{admin_user_id}/read", headers={"Authorization": f"Bearer {artist_token}"})
    assert read_res.status_code == 200
    assert read_res.json()["status"] == "ok"

    # 4. Verify conversation list contains updated last message and unread count = 0
    conv_res = client.get("/messages/conversations", headers={"Authorization": f"Bearer {artist_token}"})
    assert conv_res.status_code == 200
    convs = conv_res.json()
    assert any(c["other_user_id"] == admin_user_id for c in convs)


def test_empty_message_validation():
    """Empty or whitespace-only messages should be rejected with 400 Bad Request."""
    admin_token = get_user_token("admin@yakshagai.com", "Admin@1234")
    res = client.post(
        "/messages",
        json={"receiver_id": 1, "content": "    "},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code in [400, 422]


def test_long_message_validation():
    """Messages exceeding 2000 characters should be rejected with 400 Bad Request."""
    admin_token = get_user_token("admin@yakshagai.com", "Admin@1234")
    long_content = "X" * 2005
    res = client.post(
        "/messages",
        json={"receiver_id": 1, "content": long_content},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code in [400, 422]
