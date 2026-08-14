# 🛡️ DocSync India

## AI-Powered Government Document Verification & Assistance System

> **Your Documents. Your Device. Your Privacy.**

DocSync India is a comprehensive AI-powered platform that helps Indian citizens verify, compare, manage, and correct inconsistencies across their government documents — all processed locally on their device for maximum privacy.

---

## 🏆 Hackathon Project — Quick Start

### Prerequisites
- **Node.js** 18+ or **Bun** runtime
- **VS Code** (recommended IDE)

### One-Command Setup
```bash
# Clone or download this folder, then:
chmod +x setup.sh && ./setup.sh
```

### Manual Setup
```bash
# 1. Install dependencies
npm install
# or: bun install

# 2. Set up environment
cp .env.example .env

# 3. Initialize database
npx prisma db push
# or: bun run db:push

# 4. Start development server
npm run dev
# or: bun run dev

# 5. Open http://localhost:3000 in your browser
```

### 🎯 Demo Mode
The app works **immediately** without any SMS API configuration! OTP is shown on screen (Demo Mode). This is perfect for hackathon demos and testing.

---

## ✨ Key Features

### 🔐 Secure Authentication
- **Mobile OTP Login** — SMS-based OTP verification with multi-service fallback
- **Email/Password Auth** — Traditional signup and login
- **Demo Mode** — Works without SMS API keys (OTP shown on screen)

### 📄 AI-Powered OCR & Document Processing
- **Smart OCR Extraction** — Upload any Indian government document image and extract structured data using Vision AI
- **Supports 15+ Document Types** — Aadhaar, PAN, Passport, Driving Licence, Voter ID, Caste Certificate, Income Certificate, Marksheet, and more
- **Health Score** — Each document gets a computed health score based on detected issues

### 🔍 Cross-Document Comparison
- **Smart Comparison** — Compare extracted data across documents to find mismatches
- **Field-by-Field Analysis** — Name, DOB, Address, Gender, Father's Name side-by-side
- **Mismatch Highlighting** — Visual indicators for inconsistent data

### 🚨 AI Issue Detection & Analysis
- **Automatic Issue Detection** — AI finds 10 types of issues across your documents
- **Issue Categories**: DOB mismatch, Name mismatch, Address mismatch, Gender mismatch, Expired documents, Missing documents, Invalid formats, OCR errors
- **Severity Levels**: Critical, High, Medium, Low
- **Impact Analysis** — Explains consequences (scholarship rejection, KYC failure, etc.)
- **Fix Guidance** — Step-by-step correction instructions with portal links, fees, and processing time

### ✏️ Correction Assistant
- **Guided Corrections** — Step-by-step wizard for fixing document issues
- **Online & Offline Methods** — Covers both digital portal and physical center options
- **Portal Integration** — Direct links to UIDAI, NSDL, Passport Seva, DigiLocker, etc.
- **Offline Center Finder** — Locate CSC centers, Tehsil offices, Passport Seva Kendras

### 🎓 Scholarship & Scheme Recommendations
- **Smart Matching** — Recommends scholarships based on your documents and profile
- **Document Readiness Check** — Shows which required documents you have and which are missing
- **6+ Scholarships**: Post-Matric, Pre-Matric, Merit-cum-Means, National Fellowship, UP Scholarship, PM YASASVI
- **8+ Government Schemes**: PM Jan Dhan, PM Awas, PM Kisan, Ayushman Bharat, MUDRA, Sukanya Samriddhi, and more

### 💬 AI Chat Assistant
- **Document Expert** — Chat with AI about any Indian government document query
- **Multilingual** — Supports English, Hindi, and Marathi
- **Portal Information** — Get links to official government portals
- **Correction Guidance** — Step-by-step help for document updates

### 📊 Dashboard & Analytics
- **Document Health Score** — Overall health of all your documents (0-100)
- **Issue Summary** — Critical/High/Medium/Low breakdown
- **Expiry Tracker** — Never miss a document expiry
- **Activity Log** — Track all actions taken in the app
- **Reports** — Comprehensive document reports

### 🔔 Smart Notifications
- **Expiry Alerts** — Document expiry reminders
- **Deadline Notifications** — Application deadline tracking
- **Scheme Alerts** — New scheme and scholarship notifications

### 🌙 Dark Mode & Accessibility
- **Light/Dark Theme** — Full theme support
- **Responsive Design** — Works on mobile, tablet, and desktop
- **Accessible UI** — Built with Radix UI primitives

---

## 🏗️ Architecture

```
DocSync India/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # Backend API Routes
│   │   │   ├── auth/route.ts   # Authentication (OTP + Email)
│   │   │   ├── ocr/route.ts    # AI OCR Extraction (VLM)
│   │   │   ├── chat/route.ts   # AI Chat Assistant (LLM)
│   │   │   └── analyze/route.ts # AI Issue Detection (LLM)
│   │   ├── layout.tsx          # Root Layout
│   │   ├── page.tsx            # Main Page
│   │   └── globals.css         # Global Styles
│   ├── components/
│   │   ├── docsync/            # App Components (18 components)
│   │   │   ├── LandingPage.tsx
│   │   │   ├── AuthDialog.tsx
│   │   │   ├── AppShell.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DocumentUpload.tsx
│   │   │   ├── DocumentComparison.tsx
│   │   │   ├── IssueDetection.tsx
│   │   │   ├── CorrectionAssistant.tsx
│   │   │   ├── ScholarshipAssistant.tsx
│   │   │   ├── SchemeRecommendation.tsx
│   │   │   ├── AIChatAssistant.tsx
│   │   │   ├── ExpiryTracker.tsx
│   │   │   ├── NotificationsView.tsx
│   │   │   ├── ReportsView.tsx
│   │   │   ├── SearchView.tsx
│   │   │   ├── ProfileView.tsx
│   │   │   ├── SettingsView.tsx
│   │   │   └── AppShell.tsx
│   │   └── ui/                 # shadcn/ui Components (40+)
│   ├── lib/
│   │   ├── store.ts            # Zustand State Management
│   │   ├── data.ts             # Constants & Configuration
│   │   ├── db.ts               # Prisma Database Client
│   │   └── utils.ts            # Utility Functions
│   └── hooks/                  # Custom React Hooks
├── prisma/
│   └── schema.prisma           # Database Schema (5 models)
├── public/
│   └── logo.svg                # DocSync Shield Logo
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md         # System Architecture
│   └── API.md                  # API Documentation
├── .env.example                # Environment Template
├── setup.sh                    # One-Command Setup Script
└── package.json                # Dependencies & Scripts
```

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Frontend** | React 19 |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **State** | Zustand (persisted to localStorage) |
| **Database** | Prisma ORM + SQLite |
| **AI/OCR** | z-ai-web-dev-sdk (VLM + LLM) |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Theme** | next-themes |
| **Forms** | React Hook Form + Zod |
| **UI Primitives** | Radix UI |

---

## 🔌 API Endpoints

### `POST /api/auth`
Authentication actions (signup, login, send-otp, verify-otp, resend-otp)

### `POST /api/ocr`
AI-powered OCR extraction from document images using Vision Language Model

### `POST /api/chat`
AI chat assistant for government document queries

### `POST /api/analyze`
AI-powered cross-document issue detection and analysis

See [docs/API.md](docs/API.md) for detailed API documentation.

---

## 📱 OTP Authentication — Multi-Service Fallback

DocSync India uses a **5-level SMS fallback chain** to ensure OTP delivery:

| Priority | Service | Free? | India? | DLT Needed? |
|----------|---------|-------|--------|-------------|
| 1 | **MessageCentral** | ✅ 1,000 free OTP | ✅ | ❌ No |
| 2 | **Fast2SMS** | ⚠️ Needs ₹100 credit | ✅ | ❌ No |
| 3 | **TextBelt** | ✅ 1/day/IP | ❌ Blocked | N/A |
| 4 | **2Factor.in** | ⚠️ Limited free | ✅ | ❌ No |
| 5 | **Demo Mode** | ✅ Always | ✅ | N/A |

### Setting Up Real SMS OTP
1. Sign up at [messagecentral.com](https://www.messagecentral.com) — **FREE 1000 OTP credits, no DLT needed!**
2. Get your Customer ID, Email, and Password
3. Add to `.env`:
   ```
   MESSAGECENTRAL_CUSTOMER_ID=your_customer_id
   MESSAGECENTRAL_EMAIL=your_email
   MESSAGECENTRAL_PASSWORD=your_password
   ```
4. Restart the server — OTP will now be sent via SMS!

---

## 🗄️ Database Schema

5 Prisma models with SQLite storage:

- **User** — Profile information (name, email, phone, category, income, state)
- **Document** — Uploaded documents with extracted data and health scores
- **Issue** — Detected issues with severity, category, and fix guidance
- **Notification** — User notifications (expiry, deadline, scheme)
- **Activity** — Activity log for audit trail

---

## 🚀 Available Scripts

```bash
npm run dev          # Start development server (port 3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push Prisma schema to database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:reset     # Reset database
```

---

## 🌍 Government Portals Integrated

| Portal | URL | Purpose |
|--------|-----|---------|
| UIDAI | uidai.gov.in | Aadhaar services |
| NSDL | tin-nsdl.com | PAN services |
| Passport Seva | passportindia.gov.in | Passport services |
| DigiLocker | digilocker.gov.in | Digital document storage |
| Scholarship Portal | scholarships.gov.in | National scholarships |
| Parivahan | parivahan.gov.in | Driving licence |
| NVSP | nvsp.in | Voter ID services |

---

## 📂 Project Structure for Hackathon Submission

This project is ready to run directly in VS Code:

1. **Open this folder in VS Code**
2. **Terminal → New Terminal**
3. **Run:** `chmod +x setup.sh && ./setup.sh`
4. **Open** `http://localhost:3000` in your browser
5. **Done!** Start exploring DocSync India

### VS Code Recommended Extensions
The `.vscode/extensions.json` file recommends:
- Tailwind CSS IntelliSense
- Prisma
- ESLint
- Prettier

---

## 🔒 Privacy First

- **All document processing happens on YOUR device** — images are sent to AI only for extraction, never stored on external servers
- **Base64 storage** — Documents stored locally in SQLite as base64
- **No third-party data sharing** — Your data stays on your machine
- **Zustand + localStorage** — State persisted locally, not in cloud

---

## 🎥 Demo Flow for Hackathon

1. **Landing Page** — Show the hero section with feature highlights
2. **Sign Up** — Click "Get Started", enter mobile number, see Demo OTP
3. **Dashboard** — Show health score, issue summary, document stats
4. **Upload Document** — Upload an Aadhaar/PAN image, watch AI extract data
5. **Compare Documents** — Upload a second document, compare fields
6. **Issue Detection** — Run AI analysis to find mismatches
7. **Correction Assistant** — Show step-by-step fix guidance with portal links
8. **Scholarship Matching** — See personalized scholarship recommendations
9. **AI Chat** — Ask "How to correct DOB in Aadhaar?" and get step-by-step help
10. **Scheme Recommendations** — See matching government schemes

---

## 👥 Team

Built for college hackathon submission.

---

## 📄 License

This project is built for educational and hackathon purposes.

---

> **DocSync India** — _"Your Documents. Your Device. Your Privacy."_
