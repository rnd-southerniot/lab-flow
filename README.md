# HistoCyto Lab System

A comprehensive Histopathology and Cytopathology Laboratory Report Management System.

## Features

- **Patient Management** - Registration, verification, and specimen tracking
- **Report Workflow** - Draft, review, sign, and publish lab reports
- **PDF Generation** - Professional PDF reports with letterhead and QR verification
- **Digital Signatures** - Doctor signature capture and verification
- **Role-Based Access** - Admin and Doctor roles with specific permissions
- **AI Assistant** - Optional OpenAI integration for report suggestions

## Screenshots

| Dashboard | Report Editor | PDF Preview |
|-----------|---------------|-------------|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Report](docs/screenshots/report.png) | ![PDF](docs/screenshots/pdf.png) |

## Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose v2.0+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/rnd-southerniot/lab-flow.git
cd lab-flow/careflow-setup

# Configure environment
cp .env.histo.example .env.histo
nano .env.histo  # Update passwords and secrets

# Build and start
docker compose -f docker-compose.histo.yml build
docker compose -f docker-compose.histo.yml up -d
```

### Access

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8001
- **API Docs:** http://localhost:8001/docs

### Default Credentials

- Username: `admin`
- Password: `admin123`

> **Important:** Change the default password immediately after first login!

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend (3000)                   │
│                    - React 19 + TypeScript                   │
│                    - Tailwind CSS                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Backend (8001)                     │
│                   - Python 3.11                              │
│                   - JWT Authentication                       │
│                   - PDF Generation                           │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  PostgreSQL   │   │  PostgreSQL   │   │  PostgreSQL   │
│  histo_users  │   │histo_patients │   │ histo_reports │
└───────────────┘   └───────────────┘   └───────────────┘
                              │
                              ▼
                    ┌───────────────┐
                    │  PostgreSQL   │
                    │histo_signatures│
                    └───────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.11, SQLAlchemy 2.0 |
| Database | PostgreSQL 15 |
| PDF | xhtml2pdf, Jinja2 |
| Auth | JWT (python-jose) |
| Container | Docker, Docker Compose |

## Project Structure

```
careflow-setup/
├── backend/                    # FastAPI Backend
│   ├── core/                   # Core configuration
│   ├── modules/                # Feature modules
│   │   ├── histo_auth/         # Authentication
│   │   ├── histo_users/        # User management
│   │   ├── patients/           # Patient management
│   │   ├── reports/            # Report management
│   │   └── pdf_generator/      # PDF generation
│   ├── main.py                 # Entry point
│   └── Dockerfile
├── frontend-histocyto/         # Next.js Frontend
│   ├── app/                    # App Router pages
│   ├── components/             # React components
│   ├── lib/                    # Utilities
│   ├── services/               # API services
│   └── Dockerfile
├── docker-compose.histo.yml    # Docker configuration
├── DEPLOY.md                   # Deployment guide
├── CLAUDE.md                   # AI assistant context
└── README.md                   # This file
```

## User Roles

### Admin
- Manage users (create, edit, deactivate)
- Verify patient registrations
- View all reports and statistics
- System configuration

### Doctor
- Register patients
- Create and edit lab reports
- Sign and publish reports
- Generate PDFs

## Report Workflow

```
┌─────────┐    ┌──────────────────────┐    ┌──────────┐
│  DRAFT  │───▶│ PENDING_VERIFICATION │───▶│ VERIFIED │
└─────────┘    └──────────────────────┘    └──────────┘
                        │                        │
                        │ (reject)               ▼
                        │                  ┌──────────┐
                        └─────────────────▶│  SIGNED  │
                                           └──────────┘
                                                 │
                                                 ▼
                                          ┌───────────┐
                                          │ PUBLISHED │
                                          └───────────┘
```

## API Documentation

Once running, access the interactive API documentation:

- **Swagger UI:** http://localhost:8001/docs
- **ReDoc:** http://localhost:8001/redoc

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/histo_auth/login` | User login |
| GET | `/api/v1/patients/` | List patients |
| POST | `/api/v1/patients/` | Create patient |
| GET | `/api/v1/reports/` | List reports |
| POST | `/api/v1/reports/` | Create report |
| GET | `/api/v1/pdf/report/{id}/preview` | Preview PDF |
| GET | `/api/v1/pdf/report/{id}` | Download PDF |

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | Database username | postgres |
| `POSTGRES_PASSWORD` | Database password | root |
| `SECRET_KEY` | JWT signing key | (required) |
| `OPENAI_API_KEY` | OpenAI API key | (optional) |
| `CORS_ORIGINS` | Allowed origins | * |
| `ENVIRONMENT` | Environment name | production |

### Ports

| Service | Port |
|---------|------|
| Frontend | 3000 |
| Backend | 8001 |
| DB Users | 5432 |
| DB Patients | 5432 |
| DB Reports | 5432 |
| DB Signatures | 5432 |

## Development

### Local Development (without Docker)

```bash
# Backend
cd backend
pip install -r requirements.txt
export USE_SQLITE=true
python -m uvicorn main:app --reload --port 8001

# Frontend (new terminal)
cd frontend-histocyto
npm install --legacy-peer-deps
npm run dev
```

### Code Style

- Backend: PEP 8, type hints
- Frontend: ESLint, Prettier, TypeScript strict mode

## Deployment

See [DEPLOY.md](DEPLOY.md) for detailed deployment instructions including:

- Ubuntu VM setup
- Docker installation
- SSL/TLS configuration
- Nginx reverse proxy
- Backup procedures

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software developed for Southern IOT.

## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/rnd-southerniot/lab-flow/issues) page.

---

Built with by Southern IOT R&D Team
