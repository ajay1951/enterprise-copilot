import pytest
from pydantic import ValidationError
from app.schemas import ChatRequest, TicketUpdateRequest, AdminLogin

def test_chat_request_validation_valid():
    """Test valid chat request passes validation."""
    req = ChatRequest(session_id="123", message="Hello world")
    assert req.message == "Hello world"
    assert req.session_id == "123"

def test_chat_request_validation_invalid_message():
    """Test chat request blocks empty messages."""
    with pytest.raises(ValidationError):
        ChatRequest(session_id="123", message="")

def test_ticket_update_validation():
    """Test invalid status is blocked by schema."""
    with pytest.raises(ValidationError):
        TicketUpdateRequest(status="invalid_status")

def test_admin_login_validation():
    """Test admin login blocks empty credentials."""
    with pytest.raises(ValidationError):
        AdminLogin(username="", password="password123")
