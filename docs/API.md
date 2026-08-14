# 📡 DocSync India — API Documentation

## Base URL
```
http://localhost:3000/api
```

All endpoints accept and return `application/json`.

---

## 🔐 Authentication — `/api/auth`

### Signup with Email
```http
POST /api/auth
Content-Type: application/json

{
  "action": "signup",
  "email": "user@example.com",
  "password": "securepassword",
  "name": "Rahul Sharma",
  "phone": "9876543210"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "Rahul Sharma",
    "phone": "9876543210"
  }
}
```

**Error (409):** `{ "error": "Email already registered" }`

---

### Login with Email
```http
POST /api/auth
Content-Type: application/json

{
  "action": "login",
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "Rahul Sharma",
    "phone": "9876543210"
  }
}
```

**Error (401):** `{ "error": "Invalid email or password" }`

---

### Send OTP to Mobile
```http
POST /api/auth
Content-Type: application/json

{
  "action": "send-otp",
  "phone": "9876543210"
}
```

**Response (200) — Real SMS:**
```json
{
  "success": true,
  "message": "OTP sent to your mobile number",
  "demoMode": false
}
```

**Response (200) — Demo Mode:**
```json
{
  "success": true,
  "message": "SMS service is being set up. OTP is shown on screen for now.",
  "demoMode": true,
  "demoOtp": "482951",
  "setupInfo": "For free SMS OTP: Sign up at messagecentral.com..."
}
```

**Error (400):** `{ "error": "Please enter a valid 10-digit mobile number" }`
**Error (429):** `{ "error": "Please wait 45 seconds before requesting a new OTP" }`

---

### Verify OTP
```http
POST /api/auth
Content-Type: application/json

{
  "action": "verify-otp",
  "phone": "9876543210",
  "otp": "482951"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "user": {
    "id": "clx...",
    "email": "phone_9876543210@docsync.local",
    "name": "User 3210",
    "phone": "9876543210"
  }
}
```

**Error (401):** `{ "error": "Invalid OTP. 2 attempts remaining." }`
**Error (401):** `{ "error": "OTP has expired. Please request a new one." }`
**Error (429):** `{ "error": "Too many incorrect attempts. Please request a new OTP." }`

---

### Resend OTP
```http
POST /api/auth
Content-Type: application/json

{
  "action": "resend-otp",
  "phone": "9876543210"
}
```

Same response format as Send OTP.

---

## 📄 OCR Extraction — `/api/ocr`

### Extract Data from Document Image
```http
POST /api/ocr
Content-Type: application/json

{
  "imageData": "base64_encoded_image_string",
  "mimeType": "image/jpeg",
  "docType": "aadhaar"
}
```

**Supported docType values:**
`aadhaar`, `pan`, `passport`, `driving_licence`, `birth_certificate`, `voter_id`, `ration_card`, `income_certificate`, `caste_certificate`, `domicile_certificate`, `bank_passbook`, `marksheet_10th`, `marksheet_12th`, `leaving_certificate`, `other`

**Response (200):**
```json
{
  "success": true,
  "extractedData": {
    "fullName": "RAJESH KUMAR SHARMA",
    "dob": "15/05/1990",
    "gender": "Male",
    "fatherName": "SURESH SHARMA",
    "motherName": "",
    "address": "123, MG Road, Mumbai, Maharashtra - 400001",
    "aadhaarNumber": "1234-5678-9012",
    "panNumber": "",
    "passportNumber": "",
    "mobileNumber": "9876543210",
    "email": "",
    "documentNumber": "",
    "issueDate": "",
    "expiryDate": ""
  }
}
```

---

## 💬 AI Chat — `/api/chat`

### Send Message to AI Assistant
```http
POST /api/chat
Content-Type: application/json

{
  "message": "How to correct DOB in Aadhaar card?",
  "history": [
    { "role": "user", "content": "Previous message" },
    { "role": "assistant", "content": "Previous response" }
  ],
  "language": "en"
}
```

**Supported languages:** `en` (English), `hi` (Hindi), `mr` (Marathi)

**Response (200):**
```json
{
  "success": true,
  "response": "To correct your Date of Birth in Aadhaar, follow these steps:\n\n1. Visit the UIDAI portal at https://uidai.gov.in\n2. Click on 'Update Aadhaar'...\n..."
}
```

---

## 🔍 Issue Analysis — `/api/analyze`

### Analyze Documents for Issues
```http
POST /api/analyze
Content-Type: application/json

{
  "documents": [
    {
      "docType": "aadhaar",
      "docName": "My Aadhaar Card",
      "extractedData": {
        "fullName": "RAJESH KUMAR SHARMA",
        "dob": "15/05/1990",
        "gender": "Male",
        "address": "123, MG Road, Mumbai"
      },
      "expiryDate": null
    },
    {
      "docType": "pan",
      "docName": "My PAN Card",
      "extractedData": {
        "fullName": "RAJESH K SHARMA",
        "dob": "15/05/2008",
        "gender": "",
        "address": ""
      },
      "expiryDate": null
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "issues": [
    {
      "id": "clx-random-uuid",
      "severity": "critical",
      "category": "dob_mismatch",
      "title": "Date of Birth Mismatch",
      "description": "DOB in Aadhaar (15/05/1990) does not match DOB in PAN (15/05/2008)",
      "impact": [
        "Scholarship rejection",
        "Bank KYC failure",
        "Passport delay",
        "Government scheme rejection"
      ],
      "fixGuidance": {
        "requiredDocs": ["Aadhaar Card", "Birth Certificate", "School Certificate"],
        "method": "both",
        "fees": "₹0-50",
        "processingTime": "7-30 days",
        "department": "NSDL / UTIITSL",
        "steps": [
          "Visit NSDL portal",
          "Fill correction form",
          "Upload supporting documents",
          "Pay fee if applicable",
          "Track application status"
        ],
        "portalUrl": "https://www.tin-nsdl.com",
        "portalName": "NSDL PAN Services"
      },
      "status": "open",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

### Issue Severity Levels
| Severity | Weight | Description |
|----------|--------|-------------|
| `critical` | -20 | DOB mismatch, major ID errors |
| `high` | -10 | Name mismatch, expired document |
| `medium` | -5 | Address mismatch, minor formatting issues |
| `low` | -2 | Possible OCR error, minor inconsistency |

### Issue Categories
- `dob_mismatch` — Date of birth differs
- `name_mismatch` — Name spelling differences
- `address_mismatch` — Address inconsistency
- `gender_mismatch` — Gender differs
- `father_name_mismatch` — Father's name differs
- `mother_name_mismatch` — Mother's name differs
- `expired` — Document past expiry date
- `missing` — Missing critical document
- `invalid_format` — Invalid number format
- `ocr_error` — Possible extraction error

---

## ⚠️ Error Format

All errors follow a consistent format:
```json
{
  "error": "Human-readable error message",
  "details": "Technical details (optional, only on 500 errors)"
}
```

### HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (missing/invalid parameters) |
| 401 | Unauthorized (invalid credentials/OTP) |
| 409 | Conflict (email already registered) |
| 429 | Rate Limited (too many OTP requests/attempts) |
| 500 | Server Error |
