from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import AdminUser
from app.schemas import TicketMessageResponse, TicketReplyRequest, AdminLogin, TicketResponse, TicketUpdateRequest
from app.services.auth_service import AuthService, get_current_admin
from app.services.ticket_service import TicketService
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter()

@router.post("/login")
async def admin_login(creds: AdminLogin, db: Session = Depends(get_db)):
    user = AuthService.authenticate_admin(db, creds.username, creds.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token = AuthService.create_access_token(data={"sub": user.username})
    return {"token": access_token}

@router.get("/tickets")
async def get_tickets(db: Session = Depends(get_db), current_admin: AdminUser = Depends(get_current_admin)):
    tickets = TicketService.get_all_tickets(db)
    return [
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

@router.put("/tickets/{ticket_id}")
async def update_ticket(ticket_id: int, req: TicketUpdateRequest, db: Session = Depends(get_db), current_admin: AdminUser = Depends(get_current_admin)):
    TicketService.update_ticket_status(db, ticket_id, req.status)
    return {"message": "Ticket updated successfully"}

@router.get("/tickets/{ticket_id}/messages", response_model=list[TicketMessageResponse])
async def get_ticket_messages(ticket_id: int, db: Session = Depends(get_db), current_admin: AdminUser = Depends(get_current_admin)):
    return TicketService.get_ticket_messages(db, ticket_id)

@router.post("/tickets/{ticket_id}/reply")
async def admin_reply_to_ticket(ticket_id: int, req: TicketReplyRequest, db: Session = Depends(get_db), current_admin: AdminUser = Depends(get_current_admin)):
    TicketService.add_admin_reply(db, ticket_id, req.message)
    return {"message": "Reply sent successfully"}
