from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AdminUser
from app.schemas import TicketMessageResponse, TicketReplyRequest, AdminLogin, TicketResponse, TicketUpdateRequest
from app.services.auth_service import AuthService, get_current_admin
from app.services.ticket_service import TicketService
from app.repositories.ticket_repository import TicketRepository
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

def get_ticket_service(db: Session = Depends(get_db)) -> TicketService:
    return TicketService(TicketRepository(db))

@router.post("/login")
async def admin_login(creds: AdminLogin, db: Session = Depends(get_db)):
    user = AuthService.authenticate_admin(db, creds.username, creds.password)
    if not user:
        logger.warning(f"Failed admin login attempt for user: {creds.username}")
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    logger.info(f"Admin logged in successfully: {creds.username}")
    access_token = AuthService.create_access_token(data={"sub": user.username})
    return {"status": "success", "data": {"token": access_token}}

@router.get("/tickets")
async def get_tickets(ticket_service: TicketService = Depends(get_ticket_service), current_admin: AdminUser = Depends(get_current_admin)):
    tickets = ticket_service.get_all_tickets()
    return {
        "status": "success",
        "data": [
            {
                "id": t.id,
                "ticket_number": t.ticket_number,
                "user_email": t.user_email,
                "summary": t.summary,
                "status": t.status.value,
                "priority": t.priority.value,
                "created_at": t.created_at.isoformat()
            } for t in tickets
        ]
    }

@router.put("/tickets/{ticket_id}")
async def update_ticket(ticket_id: int, req: TicketUpdateRequest, ticket_service: TicketService = Depends(get_ticket_service), current_admin: AdminUser = Depends(get_current_admin)):
    ticket_service.update_ticket_status(ticket_id, req.status)
    logger.info(f"Admin {current_admin.username} updated ticket {ticket_id} status to {req.status}")
    return {"status": "success", "message": "Ticket updated successfully"}

@router.get("/tickets/{ticket_id}/messages")
async def get_ticket_messages(ticket_id: int, ticket_service: TicketService = Depends(get_ticket_service), current_admin: AdminUser = Depends(get_current_admin)):
    messages = ticket_service.get_ticket_messages(ticket_id)
    return {"status": "success", "data": messages}

@router.post("/tickets/{ticket_id}/reply")
async def admin_reply_to_ticket(ticket_id: int, req: TicketReplyRequest, ticket_service: TicketService = Depends(get_ticket_service), current_admin: AdminUser = Depends(get_current_admin)):
    ticket_service.add_admin_reply(ticket_id, req.message)
    logger.info(f"Admin {current_admin.username} replied to ticket {ticket_id}")
    return {"status": "success", "message": "Reply sent successfully"}
