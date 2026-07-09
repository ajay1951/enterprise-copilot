from app.models import AdminUser
from app.services.auth_service import AuthService

def test_unauthorized_admin_access(client):
    """Test that missing JWT tokens block access to admin routes."""
    response = client.get("/admin/tickets")
    assert response.status_code == 401

def test_admin_login_failure(client):
    """Test login failure with bad credentials."""
    response = client.post("/admin/login", json={"username": "admin", "password": "wrongpassword"})
    assert response.status_code == 401

def test_admin_login_success(client, db_session):
    """Test successful login returns a JWT token."""
    # Seed the test db with an admin
    hashed_pw = AuthService.get_password_hash("testpass")
    admin = AdminUser(username="testadmin", password_hash=hashed_pw)
    db_session.add(admin)
    db_session.commit()
    
    response = client.post("/admin/login", json={"username": "testadmin", "password": "testpass"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "token" in data["data"]
