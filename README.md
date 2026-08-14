# DocSync India – AI Powered Government Document Verification & Assistance System

> 🏆 **Hackathon Project** — An AI-powered full-stack web application for Indian citizens to verify, compare, manage, and correct government documents. Privacy-first architecture with local-only storage.

---

## 🚀 Quick Start (Run in VS Code)

### Prerequisites
- **Node.js 18+** OR **Bun** (recommended, faster)
- **VS Code** with the following extensions recommended:
  - Tailwind CSS IntelliSense
  - ESLint
  - Prettier

### Setup Steps

```bash
# 1. Open this folder in VS Code
#    File → Open Folder → select this project folder

# 2. Install dependencies
npm install
# OR (if you have Bun installed - recommended)
bun install

# 3. Set up environment variables
cp .env.example .env
# Then edit .env and add your API keys (see below)

# 4. Set up the database
npx prisma db push
# OR with Bun
bun run db:push

# 5. Start the development server
npm run dev
# OR with Bun
bun run dev

# 6. Open your browser
#    Go to: http://localhost:3000
```

That's it! The app should be running. 🎉

---

## 🔑 Environment Variables Setup

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

### Required (App works without these, but AI features need them)

| Variable | Description | How to Get |
|----------|-------------|------------|
| `Z_AI_API_KEY` | z-ai SDK key for AI features | Built into the project |

### Optional — For Real SMS OTP Delivery

| Variable | Description | How to Get | Cost |
|----------|-------------|------------|------|
| `MESSAGECENTRAL_CUSTOMER_ID` | MessageCentral Customer ID | Sign up at [messagecentral.com](https://www.messagecentral.com) | **FREE** — 1,000 OTP credits on signup! |
| `MESSAGECENTRAL_EMAIL` | Your MessageCentral email | Same as signup email | Free |
| `MESSAGECENTRAL_PASSWORD` | Your MessageCentral password | Your account password | Free |
| `FAST2SMS_API_KEY` | Fast2SMS API key | Sign up at [fast2sms.com](https://www.fast2sms.com) | Needs ₹100 credit |
| `TWOFACTOR_API_KEY` | 2Factor.in API key | Sign up at [2factor.in](https://2factor.in) | Free tier available |

> 💡 **For Hackathon Demo**: The app works perfectly in **demo mode** — OTP is shown on screen. No SMS API keys needed!

---

## 📱 Features

### 🔐 Authentication
- Email/Password signup & login
- Mobile OTP verification (SMS delivery with demo fallback)
- Secure session management with Zustand + localStorage
- Rate limiting, OTP expiry (5 min), max 3 attempts

### 📊 Dashboard
- Document Health Score (0-100)
- Total documents, open issues, upcoming expiries
- Recent activity timeline
- Quick action buttons

### 📄 Document Management
- **OCR Extraction** — AI-powered data extraction from 14 document types
- Upload & store documents locally (privacy-first)
- Health score tracking per document
- Expiry date monitoring

### Supported Document Types
| | | | |
|---|---|---|---|
| Aadhaar Card | PAN Card | Passport | Driving License |
| Voter ID | Ration Card | Domicile Certificate | Income Certificate |
| Caste Certificate | Birth Certificate | Marriage Certificate | Property Document |
| Bank Passbook | Utility Bill | |

### 🔍 Smart Comparison
- Side-by-side document comparison
- Field-level mismatch detection
- AI-powered discrepancy analysis

### 🛡️ Issue Detection & Correction
- AI-powered issue detection with severity levels
- Impact analysis for each issue
- Step-by-step correction guidance
- Direct links to government portals for fixes
- Nearby offline center suggestions

### 🎓 Scholarship & Scheme Assistant
- Scholarship finder based on category, income, state
- Government scheme recommendations
- Eligibility checker
- Application guidance

### 🤖 AI Chatbot
- Multilingual support (English, Hindi, Marathi)
- Context-aware document assistance
- Government process guidance
- Powered by z-ai LLM

### 📈 Reports & Analytics
- Document health reports
- Expiry tracker with alerts
- Activity history
- Export capabilities

### 🎨 UI/UX
- Dark mode / Light mode / High contrast
- Fully responsive (mobile, tablet, desktop)
- Framer Motion animations
- Accessible (WCAG 2.1)
- Global search

---

## 🏗️ Architecture

```
DocSync-India/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with theme provider
│   │   ├── page.tsx            # Main page with auth routing
│   │   ├── globals.css         # Global styles
│   │   └── api/
│   │       ├── auth/route.ts   # Auth API (signup, login, OTP)
│   │       ├── chat/route.ts   # AI Chat API (LLM-powered)
│   │       ├── ocr/route.ts    # OCR API (VLM-powered)
│   │       └── analyze/route.ts # Issue detection API
│   ├── components/
│   │   ├── docsync/            # 15+ application components
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
│   │   │   ├── NotificationsView.tsx
│   │   │   ├── ExpiryTracker.tsx
│   │   │   ├── ReportsView.tsx
│   │   │   ├── SearchView.tsx
│   │   │   ├── SettingsView.tsx
│   │   │   └── ProfileView.tsx
│   │   └── ui/                 # 40+ shadcn/ui components
│   ├── lib/
│   │   ├── store.ts            # Zustand state management
│   │   ├── data.ts             # Constants & data (doc types, portals, schemes)
│   │   ├── db.ts               # Prisma database client
│   │   └── utils.ts            # Utility functions
│   └── hooks/                  # Custom React hooks
├── prisma/
│   └── schema.prisma           # Database schema (SQLite)
├── public/
│   └── logo.svg                # DocSync India logo
├── .env.example                # Environment variables template
└── package.json                # Dependencies & scripts
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js 16** | Full-stack React framework (App Router) |
| **React 19** | UI library |
| **TypeScript 5** | Type-safe development |
| **Tailwind CSS 4** | Utility-first styling |
| **shadcn/ui** | Component library (New York style) |
| **Prisma ORM** | Database management (SQLite) |
| **Zustand** | Client state management |
| **Framer Motion** | Animations & transitions |
| **Recharts** | Data visualization charts |
| **z-ai-web-dev-sdk** | AI integration (LLM chat, VLM OCR) |
| **Lucide Icons** | Icon library |
| **date-fns** | Date utilities |
| **React Hook Form** | Form management |
| **next-themes** | Dark/Light mode |

---

## 🔒 Privacy-First Architecture

- **All documents stored locally** — never sent to external servers
- **Base64 encoding** for document storage in browser
- **No cloud uploads** — your data stays on your device
- **OTP verification** with rate limiting and expiry
- **Secure session** management

---

## 📋 Available Commands

```bash
# Development
npm run dev          # Start dev server on port 3000
npm run lint         # Run ESLint checks

# Database
npm run db:push      # Push Prisma schema to database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:reset     # Reset database

# Production
npm run build        # Build for production
npm run start        # Start production server
```

---

## 🌐 Government Portals Integrated

| Document | Portal |
|----------|--------|
| Aadhaar | [uidai.gov.in](https://uidai.gov.in) |
| PAN Card | [onlineservices.nsdl.com](https://onlineservices.nsdl.com) |
| Passport | [passportindia.gov.in](https://passportindia.gov.in) |
| Driving License | [parivahan.gov.in](https://parivahan.gov.in) |
| Voter ID | [nvsp.in](https://nvsp.in) |
| Domicile Certificate | State e-District portals |
| Caste Certificate | State e-District portals |
| Income Certificate | State e-District portals |

---

## 👥 Team

Built for **Hackathon 2025** — DocSync India aims to digitize and simplify government document management for every Indian citizen.

---

## 📝 License

This project is built for educational/hackathon purposes.

---

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/) — React Framework
- [shadcn/ui](https://ui.shadcn.com/) — Component Library
- [Prisma](https://www.prisma.io/) — ORM
- [z-ai-web-dev-sdk](https://www.npmjs.com/package/z-ai-web-dev-sdk) — AI SDK
- [Fast2SMS](https://www.fast2sms.com/) — SMS Gateway
- [MessageCentral](https://www.messagecentral.com/) — OTP SMS API
- [Framer Motion](https://www.framer.com/motion/) — Animations
- [Recharts](https://recharts.org/) — Charts
