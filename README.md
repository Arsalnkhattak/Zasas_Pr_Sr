# ZASAS: Services MVP

ZASAS is a centralized document intelligence, admission matching, and application preparation platform.
The primary goal of this MVP is to deliver a complete, reliable end-to-end flow:
**Sign up → Upload documents → OCR extraction → Confirm data → Find matching Kohat programs → Prepare application → Track status → Get notified.**

---

## 15-Day Build Roadmap

> **Target Pace:** Solo development, ~6–8 hours/day.  
> **Core Principle:** Vertical slicing — every day ends with a working, testable piece of functionality.

### Phase 1: Foundation (Days 1–3)

#### Day 1: Setup and Architecture
- Create repository with modular monolith layout (`server/` and `client/`):
  - Modules: `auth`, `documents`, `institutions`, `applications`, `notifications`.
- Provide `docker-compose.yml` with MongoDB, Redis, and MinIO (local S3-compatible object storage).
- Configure ESLint, Prettier, `.env` management, and standard Git hygiene.
- Build Express app with centralized error handling, request logging (Morgan/Winston), and health check endpoint (`/health`).
- Define core MongoDB schemas and data models.
- **Done when:** Database and services boot up and API responds to `GET /health`.

#### Day 2: Authentication and Roles
- User registration, login, logout, and token refresh (JWT in `httpOnly` secure cookies).
- Password hashing with bcrypt / argon2.
- Email verification flow and password reset flow.
- Role-based access control (RBAC): `user`, `staff`, `admin` middleware.
- Strict input validation using Zod schemas on all endpoints.
- **Done when:** Role-protected routes function reliably and pass automated API tests.

#### Day 3: Frontend Foundation
- Single-page application using React + Vite + Tailwind CSS + Lucide Icons + UI components.
- App layout with responsive navigation, theme, and toast feedback.
- Client-side routing with public and protected/role-based route guards.
- Axios API client with automatic token refresh interceptor.
- Authentication pages: Login, Registration, Password Reset, Email Verification prompt.
- **Done when:** Users can sign up, log in, persist sessions, and navigate to an authenticated dashboard shell.

---

### Phase 2: Document Intelligence (Days 4–7) *(Heart of the Product)*

#### Day 4: Secure Document Upload
- Private object storage integration (S3/MinIO) using presigned upload URLs.
- MIME type and file size validation (images and PDFs).
- `Document` model: type (`cnic_front`, `cnic_back`, `domicile`, `matric_marksheet`, `inter_marksheet`), status, storage key, owner reference.
- Audit trail logging every document upload, view, and deletion.
- Document Center UI: drag-and-drop file uploader, upload progress, and private preview modal.
- **Done when:** A user uploads a CNIC and strictly only authorized owners/admins can view it.

#### Day 5: OCR Pipeline, Part 1
- Asynchronous processing with BullMQ queue and worker (backed by Redis).
- Image preprocessing using Sharp (auto-rotation, grayscale, contrast normalization).
- OCR & Vision-LLM extraction service for CNIC (front/back) and Form-B with strict structured JSON schema.
- Store results in `ExtractedField` records (`field`, `value`, `confidence`, `source_document_id`).
- **Done when:** Uploading a CNIC automatically produces extracted structured fields in the database within seconds.

#### Day 6: OCR Pipeline, Part 2 & Validation
- Support additional academic documents: Matric & Intermediate marksheets, Domicile certificate.
- Rule-based deterministic validators:
  - Pakistani CNIC format (`XXXXX-XXXXXXX-X`).
  - Marks logic (`obtained_marks <= total_marks`, percentage calculation).
  - Plausible date checks (DOB vs. passing years).
  - Cross-document name and parentage consistency checks.
- Flagging low-confidence fields (< 85%) for human review.
- Accuracy tracking and validation benchmark script.
- **Done when:** Accuracy measured against validation samples with clear deterministic rule flags.

#### Day 7: Review & Confirm UI (Milestone 1)
- Side-by-side verification interface:
  - Left pane: high-resolution document viewer (zoom, pan, rotate).
  - Right pane: editable form fields mapped to extracted data, with low-confidence items visually highlighted.
- Confirmation action: writes verified data to `StudentProfile` and marks fields `user_verified: true`.
- **Done when:** Complete vertical flow works: Upload → OCR → Side-by-side Review → Confirmed Student Profile.

---

### Phase 3: Institutions & Matching (Days 8–10)

#### Day 8: Institutions Database
- Models: `Institution`, `Program`, `AdmissionCycle` (deadlines, quota, fee structure, eligibility criteria, application URL).
- Seed real data for Kohat universities and colleges (e.g., KUST, KMU institute, colleges).
- Polymorphic `Opportunity` schema pattern to facilitate future job/scholarship additions.
- Admin management CRUD screens for universities and admission cycles.

#### Day 9: Search and Browse
- Public search and filtering interface (by city, degree level, discipline, tuition fee, approaching deadline).
- Dedicated institution and program detail pages.
- Optimized MongoDB text search and compound indexes.

#### Day 10: Eligibility & Merit Engine
- Rule evaluation engine per program:
  - Minimum percentage / marks in SSC & HSSC.
  - Required subject streams (Pre-Medical, Pre-Engineering, ICS, etc.).
  - Merit aggregate calculation formula.
- Compare confirmed `StudentProfile` against all active programs:
  - Statuses: `Eligible`, `Ineligible` (with explicit reasons), `Missing Requirements`.
- Unit tests verifying merit edge-cases.
- **Done when:** Student dashboard displays personalized, mathematically verified program recommendations.

---

### Phase 4: Applications & Notifications (Days 11–12)

#### Day 11: Application Module
- `Application` state machine: `draft` → `prepared` → `user_submitted` → `confirmed`, `needs_action`, `rejected`, `completed`.
- Auto-generated document checklist marking required vs. uploaded files.
- Automated PDF Application Data Sheet generation compiled from confirmed profile.
- Challan / submission proof upload by applicant.
- Application status tracker and visual progress timeline.

#### Day 12: Notifications
- In-app notification center (unread badge, polling/events, dismiss actions).
- Email notifications (transactional templates for verification, status updates, deadline alerts).
- Scheduled BullMQ cron jobs for approaching admission deadlines and missing document reminders.
- Delivery status tracking (`queued`, `sent`, `failed`).

---

### Phase 5: Admin, Security, Launch (Days 13–15)

#### Day 13: Admin Dashboard
- User management table with role assignments.
- Central application review queue with status management and notes.
- Document review and manual OCR override tools.
- Aggregate operational metrics (total users, applications by status, top selected programs).

#### Day 14: Security & Quality Hardening
- HTTP security headers with Helmet, CORS lockdown, and strict rate limiting.
- Field-level encryption for sensitive PII (CNIC numbers, mobile numbers).
- Data privacy consent logging and GDPR/privacy compliant "Delete My Account & Data" endpoint.
- Comprehensive audit log for document access.
- End-to-end integration tests and error monitoring setup.

#### Day 15: Deployment & Beta Launch
- Production containerization with multi-stage Dockerfiles.
- Production environment provisioning (Nginx reverse proxy, SSL/TLS certificates).
- CI/CD workflow with GitHub Actions.
- Beta testing with initial student cohort in Kohat.
- Backlog roadmap handover for Post-MVP features.

---

## Post-Launch Roadmap (Phase 6+)
1. **Jobs & Internships Module:** Reusing `Opportunity`, `Application`, and `StudentProfile`.
2. **Payment Integrations:** Local gateways (JazzCash, Easypaisa, Safepay).
3. **SMS & WhatsApp Alerts:** Transactional notifications via Twilio/local SMS gateways.
4. **Browser Extension Autofill:** One-click application autofill on university admission portals.
5. **AI Admission Assistant & CV Builder:** Conversational counselor and automated resume generator.
