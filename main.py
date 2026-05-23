from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse
from contextlib import asynccontextmanager

from database import engine, Base
from routes import tickets

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown: nothing special needed for SQLite

app = FastAPI(
    title="SupportDesk CRM",
    description="Manage customer support tickets — fast, simple, and in one place.",
    version="1.0.0",
    lifespan=lifespan
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

# Include API routes
app.include_router(tickets.router, prefix="/api", tags=["tickets"])

# Page routes
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/tickets/new", response_class=HTMLResponse)
async def create_ticket_page(request: Request):
    return templates.TemplateResponse("create.html", {"request": request})

@app.get("/tickets/{ticket_id}", response_class=HTMLResponse)
async def ticket_detail_page(request: Request, ticket_id: str):
    return templates.TemplateResponse("detail.html", {"request": request, "ticket_id": ticket_id})

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return RedirectResponse(url="/")
