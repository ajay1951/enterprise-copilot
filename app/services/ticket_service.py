from typing import List
from app.exceptions import TicketNotFoundError, InvalidStateError
from app.models import Ticket, TicketMessage, SenderRole, TicketStatus
from app.repositories.ticket_repository import TicketRepository

class TicketService:
    """
    Business logic layer for managing tickets.
    """
    def __init__(self, repository: TicketRepository):
        self.repository = repository

    def get_all_tickets(self) -> List[Ticket]:
        return self.repository.get_all()

    def get_ticket_by_id(self, ticket_id: int) -> Ticket:
        ticket = self.repository.get_by_id(ticket_id)
        if not ticket:
            raise TicketNotFoundError(ticket_id)
        return ticket

    def update_ticket_status(self, ticket_id: int, new_status: str) -> Ticket:
        ticket = self.get_ticket_by_id(ticket_id)
        try:
            ticket.status = TicketStatus(new_status)
            return self.repository.update_ticket(ticket)
        except ValueError:
            raise InvalidStateError(f"Invalid status: {new_status}")

    def get_ticket_messages(self, ticket_id: int) -> List[TicketMessage]:
        # Ensure ticket exists
        self.get_ticket_by_id(ticket_id)
        return self.repository.get_messages(ticket_id)

    def add_admin_reply(self, ticket_id: int, message: str) -> TicketMessage:
        ticket = self.get_ticket_by_id(ticket_id)
        
        new_message = TicketMessage(
            ticket_id=ticket_id,
            sender=SenderRole.ADMIN,
            message=message
        )
        self.repository.add_message(new_message)
        
        # Automatically update ticket status
        ticket.status = TicketStatus.PENDING_USER
        self.repository.update_ticket(ticket)
        
        return new_message
