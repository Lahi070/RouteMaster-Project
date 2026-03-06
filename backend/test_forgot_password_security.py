import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import json

from database.models import Base
from main import app
from database.connection import get_db

# Setup in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_security_question_flow():
    # 1. Register a user
    register_data = {
        "username": "securityuser",
        "email": "security@example.com",
        "password": "SecurePassword123!",
        "security_question": "What is the name of your first pet?",
        "security_answer": "Fluffy",
        "full_name": "Security User"
    }
    response = client.post("/auth/register", json=register_data)
    assert response.status_code == 200
    assert "accessToken" in response.json()

    # 2. Get security question
    response = client.get(f"/auth/security-question/{register_data['username']}")
    assert response.status_code == 200
    assert response.json()["question"] == register_data["security_question"]

    # 3. Fail to reset password with wrong answer
    reset_data_fail = {
        "username": register_data["username"],
        "securityAnswer": "WrongAnswer",
        "newPassword": "NewSecurePassword123!"
    }
    response = client.post("/auth/reset-password-security", json=reset_data_fail)
    assert response.status_code == 401
    assert "Incorrect security answer" in response.json()["detail"]

    # 4. Succeed to reset password with correct answer
    reset_data_success = {
        "username": register_data["username"],
        "securityAnswer": "Fluffy",
        "newPassword": "NewSecurePassword123!"
    }
    response = client.post("/auth/reset-password-security", json=reset_data_success)
    assert response.status_code == 200
    assert "successfully" in response.json()["message"]

    # 5. Login with new password
    login_data = {
        "email": register_data["email"],
        "password": "NewSecurePassword123!"
    }
    response = client.post("/auth/login", json=login_data)
    assert response.status_code == 200
    assert "accessToken" in response.json()

