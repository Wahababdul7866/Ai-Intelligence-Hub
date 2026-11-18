import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, sync_engine

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=sync_engine)
    yield

def test_root_endpoint():
    with TestClient(app) as client:
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["project"] == "AI Intelligence Hub"
        assert data["status"] == "online"

def test_system_health():
    with TestClient(app) as client:
        response = client.get("/api/system/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["offline_first"] is True

def test_load_sample_dataset_endpoint():
    with TestClient(app) as client:
        response = client.post("/api/datasets/load-sample", data={"sample_key": "churn"})
        assert response.status_code == 200
        data = response.json()
        assert data["row_count"] == 1000
        assert "churn" in data["suggested_target_columns"]

def test_dashboard_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/system/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert "datasets_count" in data
        assert "models_trained_count" in data
