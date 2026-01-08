# HistoCyto Lab System - API Documentation

## Base URL

```
Production: https://your-domain.com/api/v1
Development: http://localhost:8001/api/v1
```

## Authentication

All API endpoints (except login and health) require JWT authentication.

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

---

## Authentication Endpoints

### Login

```http
POST /histo_auth/login
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "full_name": "System Administrator"
  }
}
```

### Get Current User

```http
GET /histo_auth/me
```

**Response (200):**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "role": "admin",
  "full_name": "System Administrator",
  "is_active": true
}
```

---

## Patient Endpoints

### List Patients

```http
GET /patients/
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| skip | int | Pagination offset (default: 0) |
| limit | int | Items per page (default: 100) |
| search | string | Search by name or invoice |
| status | string | Filter by verification status |

**Response (200):**
```json
[
  {
    "id": 1,
    "invoice_no": "INV-2026-0001",
    "patient_name": "John Doe",
    "age": 45,
    "age_unit": "years",
    "sex": "Male",
    "investigation_type": "Histopathology",
    "verification_status": "verified",
    "created_at": "2026-01-09T10:00:00Z"
  }
]
```

### Create Patient

```http
POST /patients/
```

**Request Body:**
```json
{
  "patient_name": "John Doe",
  "age": 45,
  "age_unit": "years",
  "sex": "Male",
  "phone": "+1234567890",
  "address": "123 Main St",
  "investigation_type": "Histopathology",
  "consultant_name": "Dr. Smith",
  "consultant_designation": "MD",
  "clinical_information": "Suspected malignancy",
  "specimen_type": "Tissue biopsy",
  "specimen_site": "Left breast"
}
```

**Response (201):**
```json
{
  "id": 1,
  "invoice_no": "INV-2026-0001",
  "patient_name": "John Doe",
  "verification_status": "pending",
  "created_at": "2026-01-09T10:00:00Z"
}
```

### Get Patient

```http
GET /patients/{id}
```

**Response (200):**
```json
{
  "id": 1,
  "invoice_no": "INV-2026-0001",
  "patient_name": "John Doe",
  "age": 45,
  "age_unit": "years",
  "sex": "Male",
  "phone": "+1234567890",
  "address": "123 Main St",
  "investigation_type": "Histopathology",
  "consultant_name": "Dr. Smith",
  "clinical_information": "Suspected malignancy",
  "verification_status": "verified",
  "receive_date": "2026-01-09",
  "reporting_date": null,
  "created_at": "2026-01-09T10:00:00Z"
}
```

### Update Patient

```http
PUT /patients/{id}
```

**Request Body:** (partial update allowed)
```json
{
  "patient_name": "John Doe Updated",
  "phone": "+0987654321"
}
```

### Verify Patient (Admin only)

```http
POST /patients/{id}/verify
```

**Request Body:**
```json
{
  "action": "approve",
  "notes": "Details verified"
}
```

**Response (200):**
```json
{
  "message": "Patient verified successfully",
  "verification_status": "verified"
}
```

### Get Pending Verification

```http
GET /patients/pending-verification
```

**Response (200):**
```json
[
  {
    "id": 2,
    "invoice_no": "INV-2026-0002",
    "patient_name": "Jane Smith",
    "verification_status": "pending",
    "created_at": "2026-01-09T11:00:00Z"
  }
]
```

---

## Report Endpoints

### List Reports

```http
GET /reports/
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| skip | int | Pagination offset |
| limit | int | Items per page |
| status | string | Filter by status |
| search | string | Search by invoice |

**Response (200):**
```json
[
  {
    "id": 1,
    "invoice_no": "INV-2026-0001",
    "patient_name": "John Doe",
    "investigation_type": "Histopathology",
    "status": "draft",
    "created_by": 1,
    "created_at": "2026-01-09T10:00:00Z"
  }
]
```

### Create Report

```http
POST /reports/
```

**Request Body:**
```json
{
  "invoice_no": "INV-2026-0001",
  "specimen": "Left breast tissue, mastectomy specimen",
  "gross_examination": "Received a mastectomy specimen...",
  "microscopic_examination": "Sections show infiltrating ductal carcinoma...",
  "diagnosis": "Infiltrating ductal carcinoma, Grade II",
  "special_stains": "PAS: Positive",
  "immunohistochemistry": "ER: Positive (90%), PR: Positive (70%)",
  "comments": "Recommend oncology consultation"
}
```

**Response (201):**
```json
{
  "id": 1,
  "invoice_no": "INV-2026-0001",
  "status": "draft",
  "created_at": "2026-01-09T10:00:00Z"
}
```

### Get Report

```http
GET /reports/{id}
```

**Response (200):**
```json
{
  "id": 1,
  "invoice_no": "INV-2026-0001",
  "specimen": "Left breast tissue",
  "gross_examination": "...",
  "microscopic_examination": "...",
  "diagnosis": "Infiltrating ductal carcinoma",
  "special_stains": "PAS: Positive",
  "immunohistochemistry": "ER: Positive",
  "comments": "...",
  "status": "draft",
  "created_by": 1,
  "signed_by": null,
  "signed_at": null,
  "created_at": "2026-01-09T10:00:00Z"
}
```

### Update Report

```http
PUT /reports/{id}
```

**Request Body:** (partial update allowed)
```json
{
  "diagnosis": "Updated diagnosis",
  "comments": "Additional comments"
}
```

### Submit for Verification

```http
POST /reports/{id}/submit
```

**Response (200):**
```json
{
  "message": "Report submitted for verification",
  "status": "pending_verification"
}
```

### Verify Report (Admin only)

```http
POST /reports/{id}/verify
```

**Request Body:**
```json
{
  "action": "approve",
  "notes": "Report verified"
}
```

### Sign Report (Doctor only)

```http
POST /reports/{id}/sign
```

**Response (200):**
```json
{
  "message": "Report signed successfully",
  "status": "signed",
  "signed_at": "2026-01-09T12:00:00Z"
}
```

### Publish Report

```http
POST /reports/{id}/publish
```

**Response (200):**
```json
{
  "message": "Report published successfully",
  "status": "published"
}
```

### Get Pending Reports

```http
GET /reports/pending
```

---

## PDF Endpoints

### Preview PDF (with watermark)

```http
GET /pdf/report/{id}/preview
```

**Response:** PDF file (application/pdf)

*Note: Available for any report status. Includes "PREVIEW" watermark.*

### Download PDF

```http
GET /pdf/report/{id}
```

**Response:** PDF file (application/pdf)

*Note: Only available for signed or published reports.*

---

## User Management Endpoints (Admin only)

### List Users

```http
GET /histo_users/
```

**Response (200):**
```json
[
  {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "full_name": "System Administrator",
    "is_active": true
  }
]
```

### Create User

```http
POST /histo_users/
```

**Request Body:**
```json
{
  "username": "doctor1",
  "email": "doctor1@example.com",
  "password": "securepassword",
  "role": "doctor",
  "full_name": "Dr. John Smith",
  "qualification": "MD, Pathology",
  "registration_number": "MED-12345"
}
```

### Update User

```http
PUT /histo_users/{id}
```

### Deactivate User

```http
DELETE /histo_users/{id}
```

---

## Health Check

### System Health

```http
GET /health
```

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-09T10:00:00Z",
  "version": "1.0.0"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Not enough permissions"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error",
  "error_type": "Exception"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production, consider adding rate limiting via Nginx or a dedicated service.

## Versioning

The API is versioned via URL path (`/api/v1/`). Breaking changes will increment the version number.
