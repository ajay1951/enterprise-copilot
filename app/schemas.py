from pydantic import BaseModel, Field

from typing import Optional

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="The user's message")
    session_id: str = Field(..., min_length=1, max_length=100, description="Unique session identifier")
    attachment_data: Optional[str] = Field(None, description="Base64 encoded attachment data")
    attachment_type: Optional[str] = Field(None, description="MIME type of the attachment")

class ChatResponse(BaseModel):
    status: str = "success"
    response: str
    session_id: str

class DocumentUploadResponse(BaseModel):
    status: str = "success"
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

class TicketListResponse(BaseModel):
    status: str = "success"
    data: list[TicketResponse]

class TicketUpdateRequest(BaseModel):
    status: str = Field(..., description="The new status of the ticket")