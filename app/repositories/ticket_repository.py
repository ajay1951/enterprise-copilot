from typing import List, Optional
from sqlalchemy.orm import Session
from app.models import Ticket, TicketMessage

class TicketRepository:
    """
    Handles all raw database interactions for Tickets and TicketMessages.
    """
    def __init__(self, db: Session):
        self.db = db

    def get_all(self) -> List[Ticket]:
        return self.db.query(Ticket).order_by(Ticket.created_at.desc()).all()

    def get_by_id(self, ticket_id: int) -> Optional[Ticket]:
        return self.db.query(Ticket).filter(Ticket.id == ticket_id).first()

    def get_by_ticket_number(self, ticket_number: str) -> Optional[Ticket]:
        return self.db.query(Ticket).filter(Ticket.ticket_number == ticket_number).first()

    def create_ticket(self, ticket: Ticket) -> Ticket:
        self.db.add(ticket)
        self.db.commit()
        self.db.refresh(ticket)
        return ticket

    def update_ticket(self, ticket: Ticket) -> Ticket:
        self.db.commit()
        self.db.refresh(ticket)
        return ticket

    def get_messages(self, ticket_id: int) -> List[TicketMessage]:
        return self.db.query(TicketMessage).filter(TicketMessage.ticket_id == ticket_id).order_by(TicketMessage.timestamp.asc()).all()

    def add_message(self, message: TicketMessage) -> TicketMessage:
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message
