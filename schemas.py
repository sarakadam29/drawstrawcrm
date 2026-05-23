from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import List, Optional

class NoteBase(BaseModel):
    note_text: str = Field(..., min_length=1)

class NoteCreate(NoteBase):
    pass

class NoteResponse(NoteBase):
    id: int
    ticket_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class TicketBase(BaseModel):
    customer_name: str = Field(..., min_length=1, max_length=100)
    customer_email: EmailStr
    subject: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    status: Optional[str] = "Open"

class TicketCreate(TicketBase):
    pass

class TicketUpdate(BaseModel):
    status: Optional[str] = None
    note_text: Optional[str] = None

class TicketResponse(TicketBase):
    id: int
    ticket_id: str
    created_at: datetime
    updated_at: datetime
    notes: List[NoteResponse] = []

    class Config:
        from_attributes = True

class TicketListItem(BaseModel):
    id: int
    ticket_id: str
    customer_name: str
    customer_email: str
    subject: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
