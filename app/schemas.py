from pydantic import BaseModel

from typing import Optional

class ChatRequest(BaseModel):
    message: str
    session_id: str
    attachment_data: Optional[str] = None
    attachment_type: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

class DocumentUploadResponse(BaseModel):
    message: str
    filename: str

from datetime import datetime

class TicketMessageResponse(BaseModel):
    id: int
    ticket_id: int
    sender: str
    message: str
    timestamp: datetime

    class Config:
        from_attributes = True

class TicketReplyRequest(BaseModel):
    message: str

class AdminLogin(BaseModel):
    username: str
    password: str

class TicketResponse(BaseModel):
    id: int
    ticket_number: str
    user_email: Optional[str] = None
    summary: str
    status: str
    priority: str
    created_at: str

    class Config:
        from_attributes = True

class TicketUpdateRequest(BaseModel):
    status: str