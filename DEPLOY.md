# HistoCyto Lab System - Docker Deployment Guide

## Prerequisites

- Ubuntu 20.04+ (or any Linux with Docker support)
- Docker Engine 20.10+
- Docker Compose v2.0+
- Minimum 4GB RAM, 2 CPU cores
- 20GB+ free disk space

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/rnd-southerniot/lab-flow.git
cd lab-flow/careflow-setup
```

### 2. Configure environment

```bash
# Copy the example environment file
cp .env.histo.example .env.histo

# Edit with your production values
nano .env.histo
```

**Important:** Update these values in `.env.histo`:
- `POSTGRES_PASSWORD` - Strong database password
- `SECRET_KEY` - Random 32+ character string for JWT signing
- `OPENAI_API_KEY` - Your OpenAI API key (optional, for AI features)

### 3. Build and start services

```bash
# Build all containers
docker compose -f docker-compose.histo.yml build

# Start all services
docker compose -f docker-compose.histo.yml up -d
```

### 4. Verify deployment

```bash
# Check all services are running
docker compose -f docker-compose.histo.yml ps

# Check logs
docker compose -f docker-compose.histo.yml logs -f
```

### 5. Access the application

- **Frontend:** http://your-server-ip:3000
- **Backend API:** http://your-server-ip:8001/api/v1

### 6. Create admin user

On first run, an admin user is created automatically:
- Username: `admin`
- Password: `admin123`

**Important:** Change this password immediately after first login!

## Services

| Service | Port | Description |
|---------|------|-------------|
| histo-frontend | 3000 | Next.js frontend application |
| histo-backend | 8001 | FastAPI backend API |
| db-histo-users | 5432 | PostgreSQL - User accounts |
| db-histo-patients | 5432 | PostgreSQL - Patient records |
| db-histo-reports | 5432 | PostgreSQL - Lab reports |
| db-histo-signatures | 5432 | PostgreSQL - Digital signatures |

## Common Commands

```bash
# Stop all services
docker compose -f docker-compose.histo.yml down

# Restart services
docker compose -f docker-compose.histo.yml restart

# View logs
docker compose -f docker-compose.histo.yml logs -f histo-backend
docker compose -f docker-compose.histo.yml logs -f histo-frontend

# Rebuild after code changes
docker compose -f docker-compose.histo.yml build --no-cache
docker compose -f docker-compose.histo.yml up -d

# Access backend shell
docker exec -it histo_backend bash

# Access database
docker exec -it histo_users_db psql -U postgres -d histo_users
```

## Data Backup

```bash
# Backup all databases
docker exec histo_users_db pg_dump -U postgres histo_users > backup_users.sql
docker exec histo_patients_db pg_dump -U postgres histo_patients > backup_patients.sql
docker exec histo_reports_db pg_dump -U postgres histo_reports > backup_reports.sql
docker exec histo_signatures_db pg_dump -U postgres histo_signatures > backup_signatures.sql

# Restore database
cat backup_users.sql | docker exec -i histo_users_db psql -U postgres -d histo_users
```

## Reverse Proxy (Nginx)

For production, use Nginx as a reverse proxy with SSL:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:8001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Troubleshooting

### Backend won't start
```bash
# Check logs
docker compose -f docker-compose.histo.yml logs histo-backend

# Verify database connectivity
docker exec histo_backend curl -f http://db-histo-users:5432
```

### Frontend build fails
```bash
# Rebuild with no cache
docker compose -f docker-compose.histo.yml build --no-cache histo-frontend
```

### Database connection issues
```bash
# Check database health
docker compose -f docker-compose.histo.yml ps

# Restart databases
docker compose -f docker-compose.histo.yml restart db-histo-users db-histo-patients db-histo-reports db-histo-signatures
```
