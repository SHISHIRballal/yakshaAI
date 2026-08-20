import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

Base.metadata.create_all(bind=engine)
client = TestClient(app)


def test_first_page_cursor_pagination():
    res = client.get("/artists?limit=3")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "next_cursor" in data
    assert "has_more" in data
    assert len(data["items"]) <= 3
    if data["has_more"]:
        assert data["next_cursor"] is not None


def test_next_page_cursor_pagination():
    # 1. Fetch page 1
    p1 = client.get("/artists?limit=3").json()
    items1 = p1.get("items", [])
    next_cursor = p1.get("next_cursor")

    if not next_cursor:
        pytest.skip("Not enough artists in DB to test page 2 pagination")

    # 2. Fetch page 2 using next_cursor
    p2 = client.get(f"/artists?cursor={next_cursor}&limit=3").json()
    items2 = p2.get("items", [])

    # 3. Ensure no overlapping items between page 1 and page 2
    ids1 = {a["id"] for a in items1}
    ids2 = {a["id"] for a in items2}
    assert len(ids1.intersection(ids2)) == 0


def test_invalid_cursor_handling():
    res = client.get("/artists?cursor=invalid_base64_string_123")
    assert res.status_code == 400
    assert "Invalid pagination cursor format" in res.json().get("detail", "")


def test_limit_boundary_validation():
    # Limit 0 should be rejected
    res_zero = client.get("/artists?limit=0")
    assert res_zero.status_code == 400

    # Limit > 50 should be rejected
    res_high = client.get("/artists?limit=100")
    assert res_high.status_code == 400
