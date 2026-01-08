# CLAUDE.md - Project Context for Claude Code

## Project Overview

This is the **HistoCyto Lab System** - a Histopathology and Cytopathology Lab Report Management System built on top of the Southern IOT System architecture.

## Tech Stack

### Backend
- **Framework:** FastAPI (Python 3.11)
- **Database:** PostgreSQL 15 (4 separate databases for data isolation)
- **ORM:** SQLAlchemy 2.0
- **Authentication:** JWT with python-jose
- **PDF Generation:** xhtml2pdf with Jinja2 templates
- **AI Integration:** OpenAI GPT-4 API (optional)

### Frontend
- **Framework:** Next.js 15.5 with React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom components in `/components/ui`
- **State Management:** React Context (AuthContext)

### Infrastructure
- **Containerization:** Docker with Docker Compose
- **Databases:** 4 PostgreSQL containers (users, patients, reports, signatures)
- **Reverse Proxy:** Nginx (recommended for production)

## Project Structure

```
careflow-setup/
├── backend/                    # FastAPI backend
│   ├── core/                   # Core configuration
│   │   ├── config.py          # Settings and environment
│   │   ├── database.py        # Multi-database connections
│   │   └── security.py        # JWT authentication
│   ├── modules/               # Feature modules
│   │   ├── histo_auth/        # Lab system authentication
│   │   ├── histo_users/       # User management (Admin/Doctor)
│   │   ├── patients/          # Patient registration
│   │   ├── reports/           # Lab reports & workflow
│   │   ├── pdf_generator/     # PDF generation service
│   │   └── health/            # Health check endpoints
│   ├── main.py                # Application entry point
│   ├── requirements.txt       # Python dependencies
│   └── Dockerfile             # Backend container
├── frontend-histocyto/        # Next.js frontend
│   ├── app/                   # App router pages
│   │   ├── login/             # Login page
│   │   └── dashboard/         # Dashboard routes
│   │       └── (authenticated)/
│   │           ├── patients/  # Patient management
│   │           ├── reports/   # Report management
│   │           └── users/     # User management
│   ├── components/            # React components
│   │   └── ui/                # Reusable UI components
│   ├── lib/                   # Utilities and context
│   ├── services/              # API service layer
│   └── Dockerfile             # Frontend container
├── docker-compose.histo.yml   # Production Docker config
├── .env.histo.example         # Environment template
└── DEPLOY.md                  # Deployment guide
```

## Key Concepts

### Multi-Database Architecture
The system uses 4 separate PostgreSQL databases:
- `histo_users` - Admin and Doctor accounts
- `histo_patients` - Patient records and specimens
- `histo_reports` - Lab reports and AI chat history
- `histo_signatures` - Digital signatures and certificates

### User Roles
- **Admin:** Verifies patient details, manages users, system administration
- **Doctor:** Creates reports, views slides, signs final reports

### Report Workflow
```
DRAFT → PENDING_VERIFICATION → VERIFIED → SIGNED → PUBLISHED
                ↓ (reject)                           ↓ (amend)
              DRAFT ←←←←←←←←←←←←←←←←←←←←←←←←←←←← AMENDED
```

### Authentication Flow
1. User logs in via `/api/v1/histo_auth/login`
2. JWT token returned and stored in cookie
3. Token included in Authorization header for API calls
4. Frontend uses AuthContext for state management

## Common Commands

### Development (Local)
```bash
# Backend
cd backend
export USE_SQLITE=true
python -m uvicorn main:app --reload --port 8001

# Frontend
cd frontend-histocyto
npm run dev
```

### Production (Docker)
```bash
docker compose -f docker-compose.histo.yml build
docker compose -f docker-compose.histo.yml up -d
docker compose -f docker-compose.histo.yml logs -f
```

### Database Access
```bash
docker exec -it histo_users_db psql -U postgres -d histo_users
docker exec -it histo_patients_db psql -U postgres -d histo_patients
docker exec -it histo_reports_db psql -U postgres -d histo_reports
```

## API Endpoints

### Authentication
- `POST /api/v1/histo_auth/login` - Login
- `GET /api/v1/histo_auth/me` - Get current user

### Patients
- `GET /api/v1/patients/` - List patients
- `POST /api/v1/patients/` - Create patient
- `GET /api/v1/patients/{id}` - Get patient
- `PUT /api/v1/patients/{id}` - Update patient
- `POST /api/v1/patients/{id}/verify` - Verify patient (Admin)

### Reports
- `GET /api/v1/reports/` - List reports
- `POST /api/v1/reports/` - Create report
- `GET /api/v1/reports/{id}` - Get report
- `PUT /api/v1/reports/{id}` - Update report
- `POST /api/v1/reports/{id}/submit` - Submit for verification
- `POST /api/v1/reports/{id}/sign` - Sign report (Doctor)

### PDF
- `GET /api/v1/pdf/report/{id}` - Download PDF (signed/published only)
- `GET /api/v1/pdf/report/{id}/preview` - Preview PDF with watermark

## Environment Variables

### Required
- `POSTGRES_USER` - Database username
- `POSTGRES_PASSWORD` - Database password
- `SECRET_KEY` - JWT signing key (32+ chars)

### Optional
- `OPENAI_API_KEY` - For AI assistant features
- `CORS_ORIGINS` - Allowed origins (default: *)
- `ENVIRONMENT` - development/production

## File Naming Conventions

### Backend
- Models: `modules/{module}/models/{name}.py`
- Routes: `modules/{module}/routes/{name}.py`
- Schemas: `modules/{module}/schemas/{name}.py`

### Frontend
- Pages: `app/{route}/page.tsx`
- Components: `components/{name}.tsx`
- UI Components: `components/ui/{name}.tsx`

## Testing

### API Testing
```bash
# Health check
curl http://localhost:8001/api/v1/health

# Login
curl -X POST http://localhost:8001/api/v1/histo_auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## Troubleshooting

### Backend won't start
- Check `USE_SQLITE=true` for local development
- Verify database connections in logs
- Check port 8001 is not in use

### Frontend build fails
- Run `npm ci --legacy-peer-deps`
- Check Node.js version (20+)
- Verify `BACKEND_URL` environment variable

### PDF generation fails
- Ensure xhtml2pdf is installed
- Check template exists in `modules/pdf_generator/templates/`
- Verify report and patient data exists

## Notes for Claude

1. This project uses a multi-database architecture - be careful when modifying database connections
2. The frontend uses Next.js App Router with server components
3. PDF generation uses xhtml2pdf (not WeasyPrint) for cross-platform compatibility
4. Always check the report workflow status before performing actions
5. The authentication system is shared but uses a separate histo_auth module
