# 🏗️ DocSync India — System Architecture

## Overview

DocSync India is a **full-stack Next.js 16 application** using the App Router pattern. The frontend and backend are unified in a single codebase, with API routes handling all server-side logic.

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (Client)                      │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Landing │  │ Dashboard│  │ Documents│  │   Chat   │ │
│  │  Page   │  │          │  │  Upload  │  │Assistant │ │
│  └────┬────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       │            │             │              │       │
│  ┌────┴────────────┴─────────────┴──────────────┴────┐ │
│  │              Zustand Store (localStorage)          │ │
│  └────────────────────┬──────────────────────────────┘ │
└───────────────────────┼────────────────────────────────┘
                        │ HTTP API Calls
┌───────────────────────┼────────────────────────────────┐
│                 NEXT.JS SERVER (Port 3000)              │
│  ┌────────────────────┴──────────────────────────────┐ │
│  │              API Routes (App Router)               │ │
│  │  ┌──────────┐ ┌────────┐ ┌──────┐ ┌───────────┐ │ │
│  │  │  /auth   │ │  /ocr  │ │/chat │ │ /analyze  │ │ │
│  │  │OTP+Email │ │VLM OCR │ │ LLM  │ │AI Issues  │ │ │
│  │  └────┬─────┘ └───┬────┘ └──┬───┘ └─────┬─────┘ │ │
│  └───────┼────────────┼─────────┼────────────┼───────┘ │
│          │            │         │            │          │
│  ┌───────┴────┐  ┌───┴─────────┴────────────┴───┐    │
│  │  SMS OTP   │  │     z-ai-web-dev-sdk          │    │
│  │  Services  │  │   (VLM + LLM AI Engine)       │    │
│  │  (5-level) │  │                                │    │
│  └────────────┘  └────────────────────────────────┘    │
│          │                                              │
│  ┌───────┴──────────────────────────────────────────┐  │
│  │           Prisma ORM + SQLite Database            │  │
│  │  User │ Document │ Issue │ Notification │ Activity│  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Component Hierarchy
```
RootLayout
└── ThemeProvider
    └── Toaster (Sonner)
        └── Page
            ├── LandingPage (unauthenticated)
            ├── AppShell (authenticated)
            │   ├── Sidebar (navigation)
            │   ├── Header (search, notifications, profile)
            │   └── Content Area (view switching)
            │       ├── Dashboard
            │       ├── DocumentUpload
            │       ├── DocumentComparison
            │       ├── IssueDetection
            │       ├── CorrectionAssistant
            │       ├── ScholarshipAssistant
            │       ├── SchemeRecommendation
            │       ├── AIChatAssistant
            │       ├── ExpiryTracker
            │       ├── NotificationsView
            │       ├── ReportsView
            │       ├── SearchView
            │       ├── ProfileView
            │       └── SettingsView
            └── AuthDialog
                ├── Email/Password Tab
                └── Mobile OTP Tab
```

### State Management (Zustand)
- **Single store** with `persist` middleware → localStorage
- **Partial persistence** — only essential data is persisted (auth, documents, issues, notifications, activities, chat, theme)
- **Computed values** — `getHealthScore()`, `getUnreadNotificationCount()`, `getOpenIssueCount()`

---

## Backend Architecture

### API Routes

#### `/api/auth` — Authentication Service
- **Multi-service OTP fallback chain**: MessageCentral → Fast2SMS → TextBelt → 2Factor → Demo
- **In-memory OTP store** with 5-minute expiry, max 3 verification attempts
- **Rate limiting**: 1 OTP per phone per minute
- **User creation**: Auto-creates user on OTP verification

#### `/api/ocr` — OCR Service
- Uses **z-ai-web-dev-sdk VLM** (Vision Language Model)
- Accepts base64 image data
- Returns structured JSON with 14 extracted fields
- Handles Aadhaar, PAN, Passport, and all Indian document types

#### `/api/chat` — Chat Service
- Uses **z-ai-web-dev-sdk LLM**
- System prompt specialized for Indian government documents
- Supports conversation history (multi-turn)
- Multilingual: English, Hindi, Marathi

#### `/api/analyze` — Analysis Service
- Uses **z-ai-web-dev-sdk LLM**
- Cross-document comparison for 10 issue types
- Returns severity, category, impact, and fix guidance
- Fix guidance includes portal URLs, fees, processing time, and steps

---

## OTP Authentication Flow

```
User enters phone number
        │
        ▼
[Rate limit check] ──► 429 Too Many Requests (wait 60s)
        │
        ▼
Generate 6-digit OTP
        │
        ▼
Store in-memory (phone → {otp, createdAt, attempts})
        │
        ▼
┌─── MessageCentral ──► Success? ──► Return (demoMode: false)
│       │ Failed
│       ▼
│   Fast2SMS (SMS routes + Voice) ──► Success? ──► Return
│       │ Failed
│       ▼
│   TextBelt ──► Success? ──► Return
│       │ Failed
│       ▼
│   2Factor ──► Success? ──► Return
│       │ Failed
│       ▼
└─── Demo Mode ──► Return OTP on screen (demoMode: true)
        │
        ▼
User enters OTP
        │
        ▼
[Expiry check] ──► 401 Expired
[Attempts check] ──► 429 Too many attempts
[Match check] ──► 401 Invalid OTP
        │
        ▼
Verified! ──► Find/create user ──► Return user data
```

---

## Data Flow

### Document Upload Flow
```
1. User selects image file
2. Frontend converts to base64
3. POST /api/ocr { imageData, mimeType, docType }
4. Server sends to VLM for extraction
5. Returns extractedData (14 fields)
6. Frontend stores in Zustand + renders
7. Health score computed from detected issues
```

### Issue Detection Flow
```
1. User clicks "Analyze Documents"
2. Frontend sends all documents to POST /api/analyze
3. LLM compares extracted data across documents
4. Returns array of issues with severity + fix guidance
5. Frontend stores issues in Zustand
6. Dashboard health score updates
```

---

## Database Design

```
User ──1:N──► Document
User ──1:N──► Issue
User ──1:N──► Notification
User ──1:N──► Activity
Document ──1:N──► Issue
```

All data stored in **SQLite** (`db/custom.db`) via Prisma ORM. Document images stored as base64 strings in the `Document.fileData` field.

---

## Security Considerations

- **Passwords**: Base64 encoded (not hashed — acceptable for hackathon, use bcrypt in production)
- **OTP**: In-memory store, expires after 5 minutes, max 3 attempts
- **Rate Limiting**: 1 OTP per phone per minute
- **No external data sharing**: Documents processed locally, AI extraction only
- **localStorage persistence**: Client-side only, no server sessions

---

## Performance Optimizations

- **Prisma Client Singleton**: Prevents connection pool exhaustion in dev mode
- **MessageCentral Auth Token Caching**: Token cached for 23 hours
- **OTP Store Cleanup**: Expired OTPs cleaned on every auth request
- **Zustand Partial Persistence**: Only essential state persisted to localStorage
- **Activity Log Limit**: Max 50 activities kept in memory
