import pytest
from app.services.ticket_service import TicketService
from app.models import Ticket, TicketStatus
from app.exceptions import TicketNotFoundError, InvalidStateError

class MockRepository:
    def __init__(self):
        self.tickets = {}

    def get_by_id(self, ticket_id):
        return self.tickets.get(ticket_id)

    def update_ticket(self, ticket):
        self.tickets[ticket.id] = ticket
        return ticket

def test_ticket_service_get_not_found():
    """Test getting a non-existent ticket raises an error."""
    repo = MockRepository()
    service = TicketService(repo)
    
    with pytest.raises(TicketNotFoundError):
        service.get_ticket_by_id(999)

def test_ticket_service_update_status():
    """Test updating a ticket status updates the model via repository."""
    repo = MockRepository()
    service = TicketService(repo)
    
    # Setup mock ticket
    t = Ticket(id=1, status=TicketStatus.OPEN)
    repo.tickets[1] = t
    
    updated_ticket = service.update_ticket_status(1, "resolved")
    assert updated_ticket.status == TicketStatus.RESOLVED

def test_ticket_service_invalid_status():
    """Test updating with an invalid status string raises InvalidStateError."""
    repo = MockRepository()
    service = TicketService(repo)
    
    t = Ticket(id=1, status=TicketStatus.OPEN)
    repo.tickets[1] = t
    
    with pytest.raises(InvalidStateError):
        service.update_ticket_status(1, "fake_status")
