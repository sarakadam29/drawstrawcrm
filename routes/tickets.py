from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional

from database import get_db
from models import Ticket, Note
from schemas import TicketCreate, TicketUpdate, TicketResponse, TicketListItem, NoteResponse

router = APIRouter()

def generate_ticket_id(db: Session) -> str:
    count = db.query(func.count(Ticket.id)).scalar()
    return f"TKT-{count + 1:03d}"

@router.post("/tickets", response_model=TicketResponse, status_code=201)
def create_ticket(ticket: TicketCreate, db: Session = Depends(get_db)):
    ticket_id = generate_ticket_id(db)

    db_ticket = Ticket(
        ticket_id=ticket_id,
        customer_name=ticket.customer_name,
        customer_email=ticket.customer_email,
        subject=ticket.subject,
        description=ticket.description,
        status=ticket.status or "Open"
    )

    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket

@router.get("/tickets", response_model=List[TicketListItem])
def list_tickets(
    status: Optional[str] = Query(None, description="Filter by status: Open, In Progress, Closed"),
    search: Optional[str] = Query(None, description="Search by name, email, ticket ID, or description"),
    db: Session = Depends(get_db)
):
    query = db.query(Ticket)

    if status:
        query = query.filter(Ticket.status == status)

    if search:
        search_filter = or_(
            Ticket.customer_name.ilike(f"%{search}%"),
            Ticket.customer_email.ilike(f"%{search}%"),
            Ticket.ticket_id.ilike(f"%{search}%"),
            Ticket.description.ilike(f"%{search}%"),
            Ticket.subject.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)

    tickets = query.order_by(Ticket.created_at.desc()).all()
    return tickets

@router.get("/tickets/{ticket_id}", response_model=TicketResponse)
def get_ticket(ticket_id: str, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    return ticket

@router.put("/tickets/{ticket_id}", response_model=TicketResponse)
def update_ticket(ticket_id: str, update: TicketUpdate, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")

    if update.status and update.status in ["Open", "In Progress", "Closed"]:
        ticket.status = update.status

    if update.note_text and update.note_text.strip():
        note = Note(
            ticket_id=ticket_id,
            note_text=update.note_text.strip()
        )
        db.add(note)

    db.commit()
    db.refresh(ticket)
    return ticket
