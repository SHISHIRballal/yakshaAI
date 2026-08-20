import pytest
from fastapi.testclient import TestClient
from datetime import timedelta
from app.main import app
from app.utils.jwt_handler import create_access_token
from app.config import settings

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_valid_login():
    response = client.post("/auth/login", json={
        "email": "admin@yakshagai.com",
        "password": "Admin@1234"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "admin@yakshagai.com"


def test_invalid_login():
    response = client.post("/auth/login", json={
        "email": "admin@yakshagai.com",
        "password": "WrongPassword123!"
    })
    assert response.status_code == 401


def test_missing_token_unauthorized():
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_invalid_token_unauthorized():
    headers = {"Authorization": "Bearer invalid_token_string_xyz"}
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 401


def test_expired_token_unauthorized():
    expired_token = create_access_token(
        data={"sub": "1", "role": "admin"},
        expires_delta=timedelta(seconds=-10)
    )
    headers = {"Authorization": f"Bearer {expired_token}"}
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 401


def test_unauthorized_role_access():
    # Login as non-admin organizer (or mock user)
    login_res = client.post("/auth/login", json={
        "email": "raghav.org@yakshagai.com",
        "password": "Organizer@1234"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    
    # Try accessing admin analytics
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/admin/analytics", headers=headers)
    assert response.status_code == 403


def test_invalid_input_validation():
    # Short password (< 6 chars) should fail Pydantic validation (422)
    response = client.post("/auth/register", json={
        "name": "Invalid User",
        "email": "invalid@example.com",
        "password": "123",
        "role": "organizer"
    })
    assert response.status_code == 422


def test_security_headers_present():
    response = client.get("/health")
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-XSS-Protection") == "1; mode=block"
    assert response.headers.get("Strict-Transport-Security") is not None
    assert response.headers.get("Content-Security-Policy") is not None
