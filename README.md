# SupportDesk CRM

A dark-mode customer support ticket management system built with FastAPI, SQLite, and Tailwind CSS.

## Features

- Create support tickets with customer info, issue title, and description
- Auto-generated unique ticket IDs (TKT-001, TKT-002, etc.)
- Real-time search by name, email, ticket ID, or description
- Filter tickets by status: Open, In Progress, Closed
- View full ticket details with notes history
- Update ticket status and add notes/comments
- Responsive dark mode UI inspired by Linear.app

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy, Pydantic
- **Database**: SQLite (single file)
- **Frontend**: HTML5, Tailwind CSS (CDN), Vanilla JavaScript
- **Templating**: Jinja2

## Local Setup

1. Clone the repository and navigate to the project folder:
```bash
cd datastraw-crm
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

5. Run the application:
```bash
uvicorn main:app --reload
```

6. Open your browser and go to `http://localhost:8000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tickets` | Create a new ticket |
| GET | `/api/tickets` | List all tickets (with optional `?status=` and `?search=` params) |
| GET | `/api/tickets/{ticket_id}` | Get single ticket with notes |
| PUT | `/api/tickets/{ticket_id}` | Update status and/or add a note |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database path | `sqlite:///./tickets.db` |
| `APP_ENV` | Application environment | `development` |

## Deployment

### Railway.app (Recommended)

1. Push code to GitHub
2. Create a new project on Railway.app
3. Deploy from GitHub repo
4. Set environment variable: `DATABASE_URL=sqlite:///./tickets.db`
5. Add start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

## Project Structure

```
datastraw-crm/
├── main.py              # FastAPI app entry point
├── database.py          # SQLAlchemy DB setup
├── models.py            # DB table models
├── schemas.py           # Pydantic request/response schemas
├── routes/
│   └── tickets.py       # All ticket API endpoints
├── static/
│   └── app.js           # Frontend JavaScript
├── templates/
│   ├── base.html        # Base layout with navbar
│   ├── index.html       # Home - ticket list
│   ├── create.html      # Create ticket form
│   └── detail.html      # Ticket detail + update
├── .env                 # Environment variables
├── .env.example         # Template for env vars
├── requirements.txt     # Python dependencies
├── .gitignore
└── README.md
```

## License

MIT
