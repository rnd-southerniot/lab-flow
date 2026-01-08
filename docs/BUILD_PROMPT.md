# Project Build Prompt

Use this prompt to build a similar Histopathology/Cytopathology Lab Report Management System.

---

## Complete Build Prompt

```
Build a Histopathology and Cytopathology Lab Report Management System with the following specifications:

## Tech Stack

### Backend
- FastAPI (Python 3.11+)
- PostgreSQL 15 with multi-database architecture (4 separate databases)
- SQLAlchemy 2.0 ORM
- JWT authentication with python-jose
- xhtml2pdf for PDF generation
- Jinja2 for PDF templates
- qrcode for QR code generation
- Optional: OpenAI GPT-4 integration for AI assistant

### Frontend
- Next.js 15 with App Router
- React 19
- TypeScript (strict mode)
- Tailwind CSS
- Custom UI components (Button, Input, Card, Table, Dialog, Badge, Select, Textarea)

### Infrastructure
- Docker with Docker Compose
- 4 PostgreSQL containers for data isolation
- Production-ready configuration

## Database Architecture

Create 4 separate PostgreSQL databases:

1. **histo_users** - User accounts
   - users table: id, username, email, hashed_password, role (admin/doctor), full_name, qualification, registration_number, signature_image, is_active, timestamps

2. **histo_patients** - Patient records
   - patients table: id, invoice_no (auto-generated: INV-YYYY-XXXX), patient_name, age, age_unit, sex, phone, address, investigation_type (Histopathology/Cytopathology), consultant_name, consultant_designation, clinical_information, specimen_type, specimen_site, verification_status, verified_by, receive_date, reporting_date, timestamps

3. **histo_reports** - Lab reports
   - reports table: id, invoice_no (FK to patient), specimen, gross_examination, microscopic_examination, diagnosis, special_stains, immunohistochemistry, comments, status, created_by, signed_by, signed_at, verification_code, timestamps
   - report_versions table: audit trail for changes
   - ai_chat_history table: AI conversation history

4. **histo_signatures** - Digital signatures
   - signature_certificates table: user signature images and certificates
   - report_signatures table: signed report records with verification codes

## User Roles

1. **Admin**
   - Manage users (create, edit, deactivate)
   - Verify patient registrations
   - View all reports and statistics
   - System administration

2. **Doctor**
   - Register patients
   - Create and edit lab reports
   - Sign and publish reports
   - Generate PDFs

## Report Workflow

Implement this status flow:
DRAFT → PENDING_VERIFICATION → VERIFIED → SIGNED → PUBLISHED
       ↓ (reject)
     DRAFT

Status transitions:
- Doctor creates report → DRAFT
- Doctor submits → PENDING_VERIFICATION
- Admin approves → VERIFIED (or rejects → DRAFT)
- Doctor signs → SIGNED
- Doctor publishes → PUBLISHED
- Doctor can amend published report → AMENDED

## Backend Structure

```
backend/
├── core/
│   ├── config.py         # Settings with env vars, multi-DB URLs
│   ├── database.py       # Multi-database connections and sessions
│   ├── security.py       # JWT token creation/validation
│   └── __init__.py
├── modules/
│   ├── histo_auth/       # Login endpoint, JWT tokens
│   │   ├── routes/
│   │   └── schemas/
│   ├── histo_users/      # User CRUD (admin only)
│   │   ├── models/
│   │   ├── routes/
│   │   └── schemas/
│   ├── patients/         # Patient registration and verification
│   │   ├── models/
│   │   ├── routes/
│   │   └── schemas/
│   ├── reports/          # Report CRUD and workflow
│   │   ├── models/
│   │   ├── routes/
│   │   └── schemas/
│   ├── pdf_generator/    # PDF generation service
│   │   ├── routes/
│   │   ├── services/
│   │   └── templates/    # Jinja2 HTML templates
│   └── health/           # Health check endpoint
├── main.py               # FastAPI app with CORS, routers
├── init_data.py          # Create default admin user
├── requirements.txt
└── Dockerfile
```

## Frontend Structure

```
frontend-histocyto/
├── app/
│   ├── login/page.tsx                    # Login page
│   └── dashboard/
│       └── (authenticated)/
│           ├── layout.tsx                # Auth check, sidebar
│           ├── page.tsx                  # Dashboard with stats
│           ├── patients/
│           │   ├── page.tsx              # Patient list
│           │   ├── new/page.tsx          # Create patient
│           │   ├── [id]/page.tsx         # Patient detail
│           │   ├── [id]/edit/page.tsx    # Edit patient
│           │   └── verification/page.tsx # Admin verification queue
│           ├── reports/
│           │   ├── page.tsx              # Report list
│           │   ├── new/page.tsx          # Create report
│           │   ├── [id]/page.tsx         # Report detail with workflow actions
│           │   └── pending/page.tsx      # Pending verification
│           └── users/page.tsx            # User management (admin)
├── components/
│   └── ui/                               # Reusable components
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       ├── table.tsx
│       ├── dialog.tsx
│       ├── badge.tsx
│       ├── select.tsx
│       └── textarea.tsx
├── lib/
│   ├── auth-context.tsx                  # Auth state management
│   └── config.ts                         # App configuration
├── services/
│   └── api.ts                            # API service layer
├── middleware.ts                         # Route protection
├── next.config.ts                        # API proxy config
└── Dockerfile
```

## API Endpoints

### Authentication
- POST /api/v1/histo_auth/login
- GET /api/v1/histo_auth/me

### Patients
- GET /api/v1/patients/ (list with search, filter)
- POST /api/v1/patients/ (create)
- GET /api/v1/patients/{id}
- PUT /api/v1/patients/{id}
- DELETE /api/v1/patients/{id}
- GET /api/v1/patients/pending-verification
- POST /api/v1/patients/{id}/verify

### Reports
- GET /api/v1/reports/ (list with search, filter by status)
- POST /api/v1/reports/
- GET /api/v1/reports/{id}
- PUT /api/v1/reports/{id}
- POST /api/v1/reports/{id}/submit
- POST /api/v1/reports/{id}/verify (admin)
- POST /api/v1/reports/{id}/sign (doctor)
- POST /api/v1/reports/{id}/publish
- GET /api/v1/reports/pending

### PDF
- GET /api/v1/pdf/report/{id}/preview (with watermark, any status)
- GET /api/v1/pdf/report/{id} (final, signed/published only)

### Users (Admin only)
- GET /api/v1/histo_users/
- POST /api/v1/histo_users/
- PUT /api/v1/histo_users/{id}
- DELETE /api/v1/histo_users/{id}

## PDF Template

Create a professional histopathology report template with:
- Letterhead section (lab name, address, contact)
- Patient details table (invoice, dates, name, age, sex, consultant)
- Clinical information
- Report sections: Specimen, Gross Examination, Microscopic Examination, Diagnosis
- Optional: Special Stains, Immunohistochemistry, Comments
- Doctor signature section with image
- QR code for verification
- PREVIEW watermark for draft reports

## Docker Compose

Create docker-compose.histo.yml with:
- 4 PostgreSQL containers (users, patients, reports, signatures)
- Backend container (port 8001)
- Frontend container (port 3000)
- Shared network
- Named volumes for data persistence
- Health checks
- Environment variable configuration

## Key Features to Implement

1. Auto-generate invoice numbers (INV-YYYY-XXXX format)
2. Patient verification workflow (admin approval)
3. Report status workflow with role-based actions
4. PDF preview with watermark
5. PDF download for signed/published reports
6. QR code verification system
7. Digital signature capture and storage
8. Dashboard with statistics (total patients, reports by status)
9. Search and filter on list pages
10. Role-based access control
11. JWT token in HTTP-only cookies
12. API proxy through Next.js to avoid CORS
13. AI Assistant for report writing (OpenAI GPT-4)
14. Voice-to-text dictation (Web Speech API)

## AI Assistant Feature

Implement an AI-powered assistant panel in the report editor:

### Backend - AI Module

Create `modules/ai_assistant/` with:

```python
# routes/ai.py
@router.post("/chat")
async def chat_with_ai(request: ChatRequest, db: Session):
    """General chat with AI about the report"""

@router.post("/suggest/gross")
async def suggest_gross_examination(request: SuggestionRequest):
    """AI suggests gross examination text based on specimen"""

@router.post("/suggest/microscopic")
async def suggest_microscopic(request: SuggestionRequest):
    """AI suggests microscopic examination based on gross findings"""

@router.post("/suggest/diagnosis")
async def suggest_diagnosis(request: SuggestionRequest):
    """AI suggests diagnosis based on all findings"""

# services/ai_service.py
class AIService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    async def chat(self, messages: list, context: dict) -> str:
        system_prompt = """You are a pathology assistant helping doctors write
        histopathology and cytopathology reports. Provide accurate, professional
        medical terminology. Always clarify that suggestions should be verified
        by the pathologist."""

        response = await self.client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "system", "content": system_prompt}] + messages,
            temperature=0.3
        )
        return response.choices[0].message.content

    async def suggest_text(self, field: str, context: dict) -> str:
        prompts = {
            "gross": f"Based on specimen: {context['specimen']}, suggest gross examination findings.",
            "microscopic": f"Based on gross findings: {context['gross']}, suggest microscopic examination.",
            "diagnosis": f"Based on findings: {context['microscopic']}, suggest diagnosis."
        }
        return await self.chat([{"role": "user", "content": prompts[field]}], context)
```

### Frontend - AI Chat Panel

Create `components/ai/ai-chat-panel.tsx`:

```tsx
interface AIChatPanelProps {
  reportId: number;
  reportData: ReportData;
  onSuggestionApply: (field: string, text: string) => void;
}

export function AIChatPanel({ reportId, reportData, onSuggestionApply }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    // Add user message to chat
    // Call /api/v1/ai/chat endpoint
    // Display AI response
    // Store in ai_chat_history table
  };

  const getSuggestion = async (field: "gross" | "microscopic" | "diagnosis") => {
    // Call appropriate suggestion endpoint
    // Show suggestion in chat
    // Offer "Apply" button to insert into report field
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>AI Assistant</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {/* Chat messages */}
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "text-right" : "text-left"}>
            <p>{msg.content}</p>
            {msg.suggestion && (
              <Button onClick={() => onSuggestionApply(msg.field, msg.content)}>
                Apply to {msg.field}
              </Button>
            )}
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex-col gap-2">
        {/* Quick suggestion buttons */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => getSuggestion("gross")}>
            Suggest Gross
          </Button>
          <Button variant="outline" onClick={() => getSuggestion("microscopic")}>
            Suggest Microscopic
          </Button>
          <Button variant="outline" onClick={() => getSuggestion("diagnosis")}>
            Suggest Diagnosis
          </Button>
        </div>
        {/* Chat input */}
        <div className="flex gap-2 w-full">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI assistant..."
          />
          <Button onClick={sendMessage}>Send</Button>
        </div>
      </CardFooter>
    </Card>
  );
}
```

### API Endpoints for AI

Add to API documentation:
- POST /api/v1/ai/chat - General chat with context
- POST /api/v1/ai/suggest/gross - Suggest gross examination
- POST /api/v1/ai/suggest/microscopic - Suggest microscopic findings
- POST /api/v1/ai/suggest/diagnosis - Suggest diagnosis
- GET /api/v1/ai/history/{report_id} - Get chat history for report

## Voice-to-Text Feature

Implement browser-based voice dictation using Web Speech API:

### Frontend - Voice Input Component

Create `components/voice/voice-input.tsx`:

```tsx
interface VoiceInputProps {
  onTranscript: (text: string) => void;
  language?: string;
}

export function VoiceInput({ onTranscript, language = "en-US" }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        setTranscript(interimTranscript);
        if (finalTranscript) {
          onTranscript(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [language, onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={isListening ? "destructive" : "outline"}
        size="icon"
        onClick={toggleListening}
        title={isListening ? "Stop dictation" : "Start dictation"}
      >
        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>
      {isListening && (
        <span className="text-sm text-muted-foreground animate-pulse">
          Listening... {transcript}
        </span>
      )}
    </div>
  );
}
```

### Integrate Voice Input in Report Editor

Update report form fields to include voice input:

```tsx
// In report editor page
const [grossExamination, setGrossExamination] = useState("");

const handleVoiceInput = (field: string) => (text: string) => {
  switch (field) {
    case "gross":
      setGrossExamination((prev) => prev + " " + text);
      break;
    case "microscopic":
      setMicroscopicExamination((prev) => prev + " " + text);
      break;
    case "diagnosis":
      setDiagnosis((prev) => prev + " " + text);
      break;
  }
};

return (
  <div className="space-y-4">
    {/* Gross Examination Field */}
    <div>
      <div className="flex justify-between items-center mb-2">
        <Label>Gross Examination</Label>
        <VoiceInput onTranscript={handleVoiceInput("gross")} />
      </div>
      <Textarea
        value={grossExamination}
        onChange={(e) => setGrossExamination(e.target.value)}
        rows={6}
        placeholder="Dictate or type gross examination findings..."
      />
    </div>

    {/* Microscopic Examination Field */}
    <div>
      <div className="flex justify-between items-center mb-2">
        <Label>Microscopic Examination</Label>
        <VoiceInput onTranscript={handleVoiceInput("microscopic")} />
      </div>
      <Textarea
        value={microscopicExamination}
        onChange={(e) => setMicroscopicExamination(e.target.value)}
        rows={6}
      />
    </div>

    {/* Similar for diagnosis and other fields */}
  </div>
);
```

### Voice Commands (Optional Enhancement)

Add voice command recognition for common actions:

```tsx
const processVoiceCommand = (text: string) => {
  const lowerText = text.toLowerCase().trim();

  // Command patterns
  if (lowerText.startsWith("suggest gross")) {
    getSuggestion("gross");
  } else if (lowerText.startsWith("suggest microscopic")) {
    getSuggestion("microscopic");
  } else if (lowerText.startsWith("suggest diagnosis")) {
    getSuggestion("diagnosis");
  } else if (lowerText === "save report") {
    handleSave();
  } else if (lowerText === "submit report") {
    handleSubmit();
  } else {
    // Regular dictation - append to current field
    appendToCurrentField(text);
  }
};
```

### Browser Compatibility Note

Add a compatibility check and fallback message:

```tsx
const isSpeechRecognitionSupported = () => {
  return typeof window !== "undefined" &&
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);
};

// Show warning if not supported
{!isSpeechRecognitionSupported() && (
  <Alert variant="warning">
    Voice dictation is not supported in this browser.
    Please use Chrome, Edge, or Safari for voice features.
  </Alert>
)}
```

## Default Admin User

On first startup, create:
- Username: admin
- Password: admin123
- Role: admin

## Environment Variables

Required:
- POSTGRES_USER, POSTGRES_PASSWORD
- SECRET_KEY (JWT signing, 32+ chars)
- Database host/port for each database

Optional:
- OPENAI_API_KEY (for AI features)
- CORS_ORIGINS
- ENVIRONMENT (development/production)

## Security Considerations

1. Password hashing with bcrypt
2. JWT tokens with expiration
3. Role-based route protection
4. Input validation with Pydantic
5. SQL injection prevention via ORM
6. CORS configuration
7. Environment-based secrets

Start by setting up the backend with the multi-database architecture, then create the frontend with authentication, and finally add the Docker configuration.
```

---

## Shorter Version (Quick Start)

```
Build a Lab Report Management System:

Tech: FastAPI + Next.js 15 + PostgreSQL + Docker + OpenAI GPT-4

Features:
1. Multi-database: users, patients, reports, signatures
2. Roles: Admin (verify patients, manage users) and Doctor (create reports, sign)
3. Report workflow: Draft → Pending → Verified → Signed → Published
4. PDF generation with xhtml2pdf, QR codes, watermarks
5. JWT auth with role-based access
6. AI Assistant: GPT-4 powered suggestions for gross, microscopic, diagnosis fields
7. Voice-to-Text: Browser Web Speech API for dictating report content

Backend modules: histo_auth, histo_users, patients, reports, pdf_generator, ai_assistant
Frontend pages: login, dashboard, patients (list/new/detail/verification), reports (list/new/detail/pending), users
Frontend components: ai-chat-panel, voice-input

AI Features:
- Chat panel in report editor for asking questions
- "Suggest Gross/Microscopic/Diagnosis" buttons
- Apply AI suggestions directly to form fields
- Chat history stored per report

Voice Features:
- Mic button on each text field
- Real-time transcription
- Voice commands: "suggest gross", "save report", "submit report"
- Browser compatibility: Chrome, Edge, Safari

Docker: 4 PostgreSQL DBs + backend (8001) + frontend (3000)

Auto-generate invoice numbers (INV-YYYY-XXXX), patient verification flow, digital signatures.
```

---

## Customization Points

When adapting this prompt for other domains, modify:

1. **Domain terminology**: Replace "Histopathology/Cytopathology" with your domain
2. **Report fields**: Adjust specimen, gross_examination, microscopic_examination, diagnosis
3. **User roles**: Modify admin/doctor to fit your organization
4. **Workflow states**: Customize the approval flow
5. **PDF template**: Design for your industry requirements
6. **Database schema**: Add/remove fields as needed

---

## Example Adaptations

### Radiology Report System
- Change investigation_type to: X-Ray, CT, MRI, Ultrasound
- Replace microscopic_examination with imaging_findings
- Add fields: contrast_used, radiation_dose

### Pathology Lab (Blood Tests)
- Change specimen fields to: blood_sample_type, collection_time
- Replace microscopic with test_results (JSON)
- Add reference_ranges table

### Veterinary Lab
- Add animal_type, breed, owner_name fields
- Modify patient to animal terminology
- Adjust age_unit options (weeks, months, years)
