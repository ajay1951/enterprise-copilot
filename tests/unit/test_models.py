import pytest
from app.models import Ticket, TicketStatus, TicketPriority

def test_ticket_generate_number():
    """Test that ticket numbers are generated uniquely and correctly."""
    ticket1 = Ticket.generate_ticket_number()
    ticket2 = Ticket.generate_ticket_number()
    
    assert ticket1.startswith("TKT-")
    assert ticket2.startswith("TKT-")
    assert ticket1 != ticket2

def test_ticket_status_enum():
    """Test that ticket status enums map correctly."""
    assert TicketStatus.OPEN.value == "open"
    assert TicketStatus.RESOLVED.value == "resolved"

def test_ticket_priority_enum():
    """Test that ticket priority enums map correctly."""
    assert TicketPriority.HIGH.value == "high"
    assert TicketPriority.LOW.value == "low"
