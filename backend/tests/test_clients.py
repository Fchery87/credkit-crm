import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import get_db, Base

from .utils import strip_postgres_casts

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_clients.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def client():
    strip_postgres_casts(Base.metadata)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def auth_headers(client: TestClient):
    """Create authenticated user and return auth headers"""
    # Register user
    user_data = {
        "email": "test@example.com",
        "password": "testpass123",
        "first_name": "Test",
        "last_name": "User",
        "organization_name": "Test Org"
    }
    client.post("/api/v1/auth/register", json=user_data)
    
    # Login
    login_response = client.post("/api/v1/auth/token", data={
        "username": user_data["email"],
        "password": user_data["password"]
    })
    token = login_response.json()["access_token"]
    
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def sample_client_data():
    return {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "phone": "+1-555-0123"
    }

def test_create_client(client: TestClient, auth_headers, sample_client_data):
    """Test client creation"""
    response = client.post("/api/v1/clients/", json=sample_client_data, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == sample_client_data["first_name"]
    assert data["last_name"] == sample_client_data["last_name"]
    assert data["email"] == sample_client_data["email"]
    assert "id" in data

def test_create_client_unauthorized(client: TestClient, sample_client_data):
    """Test client creation without authentication"""
    response = client.post("/api/v1/clients/", json=sample_client_data)
    assert response.status_code == 401

def test_list_clients(client: TestClient, auth_headers, sample_client_data):
    """Test listing clients"""
    # Create a client first
    client.post("/api/v1/clients/", json=sample_client_data, headers=auth_headers)
    
    # List clients
    response = client.get("/api/v1/clients/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["first_name"] == sample_client_data["first_name"]

def test_list_clients_with_search(client: TestClient, auth_headers, sample_client_data):
    """Test listing clients with search filter"""
    # Create a client first
    client.post("/api/v1/clients/", json=sample_client_data, headers=auth_headers)
    
    # Search for client
    response = client.get("/api/v1/clients/?search=John", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert "John" in data[0]["first_name"]

def test_list_clients_empty_search(client: TestClient, auth_headers):
    """Test listing clients with search that returns no results"""
    response = client.get("/api/v1/clients/?search=NonexistentName", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0

def test_client_pagination(client: TestClient, auth_headers):
    """Test client list pagination"""
    # Create multiple clients
    for i in range(5):
        client_data = {
            "first_name": f"Client{i}",
            "last_name": "Test",
            "email": f"client{i}@example.com"
        }
        client.post("/api/v1/clients/", json=client_data, headers=auth_headers)
    
    # Test pagination
    response = client.get("/api/v1/clients/?limit=2&offset=0", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    
    # Test second page
    response = client.get("/api/v1/clients/?limit=2&offset=2", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

def test_client_sorting(client: TestClient, auth_headers):
    """Test client list sorting"""
    # Create clients with different names
    clients = [
        {"first_name": "Alice", "last_name": "Smith", "email": "alice@example.com"},
        {"first_name": "Bob", "last_name": "Johnson", "email": "bob@example.com"},
        {"first_name": "Charlie", "last_name": "Brown", "email": "charlie@example.com"}
    ]
    
    for client_data in clients:
        client.post("/api/v1/clients/", json=client_data, headers=auth_headers)
    
    # Test ascending sort
    response = client.get("/api/v1/clients/?sort_by=first_name&sort_order=asc", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data[0]["first_name"] == "Alice"
    
    # Test descending sort
    response = client.get("/api/v1/clients/?sort_by=first_name&sort_order=desc", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data[0]["first_name"] == "Charlie"
