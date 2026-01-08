# HistoCyto Lab System - Database Schema

## Overview

The system uses a multi-database architecture with 4 separate PostgreSQL databases for data isolation and security.

## Databases

| Database | Port | Purpose |
|----------|------|---------|
| histo_users | 5432 | User accounts and authentication |
| histo_patients | 5432 | Patient records and specimens |
| histo_reports | 5432 | Lab reports and AI history |
| histo_signatures | 5432 | Digital signatures |

---

## histo_users Database

### users

Stores admin and doctor accounts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| username | VARCHAR(50) | UNIQUE, NOT NULL | Login username |
| email | VARCHAR(100) | UNIQUE, NOT NULL | Email address |
| hashed_password | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| role | VARCHAR(20) | NOT NULL | 'admin' or 'doctor' |
| full_name | VARCHAR(100) | | Display name |
| qualification | VARCHAR(100) | | Medical qualification |
| registration_number | VARCHAR(50) | | Medical registration ID |
| signature_image | TEXT | | Base64 signature image |
| is_active | BOOLEAN | DEFAULT true | Account status |
| created_at | TIMESTAMP | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMP | | Last update timestamp |

**Indexes:**
- `idx_users_username` ON username
- `idx_users_email` ON email
- `idx_users_role` ON role

---

## histo_patients Database

### patients

Stores patient demographic information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| invoice_no | VARCHAR(20) | UNIQUE, NOT NULL | Auto-generated invoice |
| patient_name | VARCHAR(100) | NOT NULL | Patient full name |
| age | INTEGER | NOT NULL | Patient age |
| age_unit | VARCHAR(10) | DEFAULT 'years' | 'years', 'months', 'days' |
| sex | VARCHAR(10) | NOT NULL | 'Male', 'Female', 'Other' |
| phone | VARCHAR(20) | | Contact number |
| address | TEXT | | Patient address |
| investigation_type | VARCHAR(50) | NOT NULL | 'Histopathology', 'Cytopathology' |
| consultant_name | VARCHAR(100) | | Referring doctor |
| consultant_designation | VARCHAR(100) | | Doctor's designation |
| clinical_information | TEXT | | Clinical notes |
| specimen_type | VARCHAR(100) | | Type of specimen |
| specimen_site | VARCHAR(100) | | Anatomical site |
| verification_status | VARCHAR(20) | DEFAULT 'pending' | 'pending', 'verified', 'rejected' |
| verified_by | INTEGER | | Admin user ID |
| verified_at | TIMESTAMP | | Verification timestamp |
| receive_date | DATE | DEFAULT today | Specimen receive date |
| reporting_date | DATE | | Report completion date |
| created_by | INTEGER | | Creator user ID |
| created_at | TIMESTAMP | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMP | | Last update timestamp |

**Indexes:**
- `idx_patients_invoice` ON invoice_no
- `idx_patients_name` ON patient_name
- `idx_patients_status` ON verification_status
- `idx_patients_date` ON receive_date

### Invoice Number Format

Auto-generated format: `INV-{YEAR}-{SEQUENCE}`

Example: `INV-2026-0001`, `INV-2026-0002`

---

## histo_reports Database

### reports

Stores lab report content and workflow status.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| invoice_no | VARCHAR(20) | NOT NULL | Reference to patient |
| specimen | TEXT | | Specimen description |
| gross_examination | TEXT | | Gross findings |
| microscopic_examination | TEXT | | Microscopic findings |
| diagnosis | TEXT | | Final diagnosis |
| special_stains | TEXT | | Special stain results |
| immunohistochemistry | TEXT | | IHC results |
| comments | TEXT | | Additional comments |
| status | VARCHAR(30) | DEFAULT 'draft' | Workflow status |
| created_by | INTEGER | | Creator user ID |
| signed_by | INTEGER | | Signing doctor ID |
| signed_at | TIMESTAMP | | Signature timestamp |
| published_at | TIMESTAMP | | Publication timestamp |
| verification_code | VARCHAR(20) | | QR verification code |
| created_at | TIMESTAMP | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMP | | Last update timestamp |

**Status Values:**
- `draft` - Initial creation
- `pending_verification` - Awaiting admin review
- `verified` - Admin approved
- `signed` - Doctor signed
- `published` - Finalized and public
- `amended` - Modified after publication

**Indexes:**
- `idx_reports_invoice` ON invoice_no
- `idx_reports_status` ON status
- `idx_reports_created` ON created_at

### report_versions

Audit trail for report changes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| report_id | INTEGER | FK reports.id | Parent report |
| version | INTEGER | NOT NULL | Version number |
| content | JSONB | NOT NULL | Report snapshot |
| changed_by | INTEGER | | User who made changes |
| change_reason | TEXT | | Reason for change |
| created_at | TIMESTAMP | DEFAULT now() | Version timestamp |

### ai_chat_history

Stores AI assistant conversations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| report_id | INTEGER | FK reports.id | Related report |
| user_id | INTEGER | | User ID |
| role | VARCHAR(20) | NOT NULL | 'user' or 'assistant' |
| content | TEXT | NOT NULL | Message content |
| created_at | TIMESTAMP | DEFAULT now() | Message timestamp |

---

## histo_signatures Database

### signature_certificates

Stores doctor signature images and certificates.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| user_id | INTEGER | UNIQUE, NOT NULL | Doctor user ID |
| signature_image | TEXT | | Base64 signature image |
| certificate_hash | VARCHAR(64) | | SHA-256 hash |
| valid_from | DATE | | Certificate start date |
| valid_until | DATE | | Certificate expiry date |
| is_active | BOOLEAN | DEFAULT true | Certificate status |
| created_at | TIMESTAMP | DEFAULT now() | Creation timestamp |

### report_signatures

Links signed reports to signature records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| report_id | INTEGER | NOT NULL | Report ID |
| certificate_id | INTEGER | FK signature_certificates.id | Certificate used |
| signature_hash | VARCHAR(64) | NOT NULL | Signature hash |
| verification_code | VARCHAR(20) | UNIQUE | QR verification code |
| signed_at | TIMESTAMP | DEFAULT now() | Signature timestamp |
| ip_address | VARCHAR(45) | | Signing IP address |

**Indexes:**
- `idx_signatures_report` ON report_id
- `idx_signatures_code` ON verification_code

---

## Entity Relationship Diagram

```
┌─────────────────┐       ┌──────────────────┐
│     users       │       │    patients      │
├─────────────────┤       ├──────────────────┤
│ id (PK)         │       │ id (PK)          │
│ username        │       │ invoice_no (UK)  │
│ email           │       │ patient_name     │
│ role            │◀──────│ created_by (FK)  │
│ ...             │       │ verified_by (FK) │
└─────────────────┘       │ ...              │
        │                 └──────────────────┘
        │                          │
        │                          │ invoice_no
        │                          ▼
        │                 ┌──────────────────┐
        │                 │     reports      │
        │                 ├──────────────────┤
        │                 │ id (PK)          │
        ├────────────────▶│ invoice_no       │
        │ created_by      │ status           │
        │ signed_by       │ created_by (FK)  │
        │                 │ signed_by (FK)   │
        │                 │ ...              │
        │                 └──────────────────┘
        │                          │
        │                          │
        ▼                          ▼
┌─────────────────┐       ┌──────────────────┐
│ signature_      │       │ report_versions  │
│ certificates    │       ├──────────────────┤
├─────────────────┤       │ id (PK)          │
│ id (PK)         │       │ report_id (FK)   │
│ user_id (FK,UK) │       │ version          │
│ signature_image │       │ content (JSONB)  │
│ ...             │       │ ...              │
└─────────────────┘       └──────────────────┘
        │
        │
        ▼
┌─────────────────┐
│ report_         │
│ signatures      │
├─────────────────┤
│ id (PK)         │
│ report_id       │
│ certificate_id  │
│ verification_   │
│ code (UK)       │
│ ...             │
└─────────────────┘
```

---

## Database Migrations

Migrations are handled automatically on application startup using SQLAlchemy's `create_all()`.

For production, consider using Alembic for version-controlled migrations:

```bash
# Generate migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## Backup & Restore

### Backup

```bash
# Backup all databases
docker exec histo_users_db pg_dump -U postgres -d histo_users > backup_users_$(date +%Y%m%d).sql
docker exec histo_patients_db pg_dump -U postgres -d histo_patients > backup_patients_$(date +%Y%m%d).sql
docker exec histo_reports_db pg_dump -U postgres -d histo_reports > backup_reports_$(date +%Y%m%d).sql
docker exec histo_signatures_db pg_dump -U postgres -d histo_signatures > backup_signatures_$(date +%Y%m%d).sql
```

### Restore

```bash
# Restore database
cat backup_users_20260109.sql | docker exec -i histo_users_db psql -U postgres -d histo_users
```

---

## Performance Considerations

1. **Indexing** - All foreign keys and frequently queried columns are indexed
2. **Connection Pooling** - SQLAlchemy configured with pool_size=25, max_overflow=25
3. **Query Optimization** - Use eager loading for related data
4. **Archival** - Consider archiving old published reports after 5+ years
