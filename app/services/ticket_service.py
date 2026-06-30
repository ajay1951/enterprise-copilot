from typing import List
from sqlalchemy.orm import Session
from app.exceptions import TicketNotFoundError, InvalidStateError
from app.models import Ticket, TicketMessage, SenderRole, TicketStatus

class TicketService:
    
    @staticmethod
    def get_all_tickets(db: Session) -> List[Ticket]:
        return db.query(Ticket).order_by(Ticket.created_at.desc()).all()

    @staticmethod
    def get_ticket_by_id(db: Session, ticket_id: int) -> Ticket:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            raise TicketNotFoundError(ticket_id)
        return ticket

    @staticmethod
    def update_ticket_status(db: Session, ticket_id: int, new_status: str) -> Ticket:
        ticket = TicketService.get_ticket_by_id(db, ticket_id)
        try:
            ticket.status = TicketStatus(new_status)
            db.commit()
            db.refresh(ticket)
            return ticket
        except ValueError:
            raise InvalidStateError(f"Invalid status: {new_status}")

    @staticmethod
    def get_ticket_messages(db: Session, ticket_id: int) -> List[TicketMessage]:
        # Ensure ticket exists
        TicketService.get_ticket_by_id(db, ticket_id)
        return db.query(TicketMessage).filter(TicketMessage.ticket_id == ticket_id).order_by(TicketMessage.timestamp.asc()).all()

    @staticmethod
    def add_admin_reply(db: Session, ticket_id: int, message: str) -> TicketMessage:
        ticket = TicketService.get_ticket_by_id(db, ticket_id)
        
        new_message = TicketMessage(
            ticket_id=ticket_id,
            sender=SenderRole.ADMIN,
            message=message
        )
        db.add(new_message)
        
        # Automatically update ticket status
        ticket.status = TicketStatus.PENDING_USER
        
        db.commit()
        db.refresh(new_message)
        return new_message
