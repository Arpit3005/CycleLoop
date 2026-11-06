# CycleLoop – Smart Campus Bicycle Rental System

**CycleLoop** is a production-oriented, responsive web application for managing campus bicycle-sharing ecosystems. Built specifically for college campuses, it allows students to locate, scan, rent, ride, return, and pay for campus bicycles via digital UPI checkout, while granting administrators complete control over fleet status, dynamic pricing, maintenance tickets, student authorizations, and analytics.

---

## 🌟 Key Features

### 🎓 Student Experience (Mobile-First)
- **Campus Authentication**: Register and login using university roll numbers and college emails.
- **Real-Time Fleet Discovery**: Instant overview of available bicycles grouped by campus station hubs (Main Gate, Library Hub, Hostel Block 3, Sports Complex).
- **QR Code Scanning**: Scan the bicycle frame/handlebar QR code via smartphone camera or using manual bicycle code fallback (`CYC-001`).
- **One-Active-Ride Enforcement**: Prevents accidental or concurrent rentals.
- **Authoritative Live Rental Dashboard**: Dynamic elapsed timer updating in real time with estimated charges calculated using server pricing snapshots.
- **Authoritative Return Fare Calculation**: Exact duration and rental fare are computed strictly on the backend using authoritative PostgreSQL server timestamps (`startTime` and `endTime`).
- **Digital UPI Checkout**: Simulated campus UPI payment modal supporting Google Pay, PhonePe, Paytm, BHIM UPI, and Razorpay with server-side signature verification.
- **Riding & Transaction History**: Paginated ride records, duration logs, and verified invoices.

### 🛡️ Administrator Operations Console
- **System Metrics Overview**: Live counts of active rides, available fleet, bikes in repair, total students, total revenue, and pending dues.
- **Fleet & QR Code Management**:
  - Add, edit, decommission, and reassign bicycles.
  - Automatic unique bicycle codes (`CYC-001`, `CYC-002`, etc.) and cryptographically secure tokens.
  - Built-in QR Code Generator with high-resolution preview, printable tag format, and instant **Download PNG** / **Download SVG** buttons.
- **Student Authorization Directory**:
  - Search students by name, roll number, or department.
  - Filter by branch or status.
  - Enable or suspend student accounts with audit tracking.
- **Rental Session Monitor & Exceptional Resolution**:
  - Filter and inspect ongoing and completed rentals.
  - **Exceptional Situation Resolution**: Force return or cancel rentals with mandatory audit notes.
- **Dynamic Pricing Engine**:
  - Configurable hourly rental rate (default ₹12.50/hr).
  - Historical pricing ledger with timestamp and administrator attribution.
  - Preserves historical rates for past and ongoing rentals.
- **Maintenance Depot**:
  - Report bicycle mechanical defects and tire punctures.
  - Automatically isolates affected bicycles from student rental until resolved.
- **Usage & Revenue Analytics**: Interactive charts using Recharts for 7-day revenue, rental volume, and station fleet distribution.
- **Security & Audit Logs**: Immutable audit log of all administrative actions.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, React Router v6, Axios, Recharts, Lucide React, html5-qrcode |
| **Backend** | Node.js, Express.js, TypeScript, REST API, JWT Authentication, bcryptjs, Zod, QRCode, Razorpay SDK |
| **Database** | PostgreSQL, Prisma ORM |
| **Security** | Role-Based Access Control (RBAC), Rate Limiting, CORS, HMAC Webhook Signatures, Password Hashing |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or pnpm

### 1. Installation
Install dependencies for both backend and frontend:
```bash
# Install all dependencies across both services
npm run install:all
```

### 2. Environment Configuration
Backend `.env` file is located at `backend/.env`:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:password@127.0.0.1:5432/cycleloop"
JWT_SECRET="cycleloop_super_secret_jwt_key_2026_campus"
PAYMENT_MODE="SIMULATED"
RAZORPAY_KEY_ID="rzp_test_campuscycleloop"
RAZORPAY_KEY_SECRET="rzp_secret_campuscycleloop"
FRONTEND_URL="http://localhost:5173"
```

### 3. Database Initialization & Seeding
Start PostgreSQL and populate with initial campus fleet, students, and admins:
```bash
# Start database & seed sample fleet and credentials
npm run seed
```

### 4. Running the Application
Run backend and frontend servers:

```bash
# Terminal 1: Backend API (port 5000)
npm run dev:backend

# Terminal 2: Frontend Client (port 5173)
npm run dev:frontend
```

Open your browser at:
- **Student & Admin Web App**: [http://localhost:5173](http://localhost:5173)
- **Backend API Health**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 👥 Seeded Test Credentials

### 🎓 Seeded Student Accounts (Electrical and Electronics Engineering)
| Name | Roll Number | College Email | Default Password | Department |
|---|---|---|---|---|
| Arpit Kumar Ranjan | `525005` | `525005@student.nitandhra.ac.in` | `Student@123` | Electrical and Electronics Engineering |
| Anshuman Mishra | `525004` | `525004@student.nitandhra.ac.in` | `Student@123` | Electrical and Electronics Engineering |
| Linkan Sarkar | `525040` | `525040@student.nitandhra.ac.in` | `Student@123` | Electrical and Electronics Engineering |
| Karthepan Murali Kannan | `525029` | `525029@student.nitandhra.ac.in` | `Student@123` | Electrical and Electronics Engineering |
| Midathada Chaitanya Naidu | `525042` | `525042@student.nitandhra.ac.in` | `Student@123` | Electrical and Electronics Engineering |

*(Students can sign in using either their roll number or their full college email address. Quick-fill buttons are provided on the login page).*

### 🛡️ Administrators
| Role | Email | Password | Access Level |
|---|---|---|---|
| Super Admin | `admin@campuscycle.edu` | `Admin@123` | Full Campus Fleet & Pricing Control |
| Operator | `operator@campuscycle.edu` | `Operator@123` | Station Fleet & Maintenance Operations |

---

## 🚲 Bicycle QR Codes for Testing

The database comes pre-seeded with 8 campus bicycles across 4 campus stands:

| Bicycle Code | Model | Campus Station | Default Status |
|---|---|---|---|
| `CYC-001` | Campus Cruiser Pro V2 | Main Gate Station | AVAILABLE |
| `CYC-002` | Campus Cruiser Pro V2 | Central Library Hub | AVAILABLE |
| `CYC-003` | EcoRide Single-Speed | Hostel Block 3 Hub | AVAILABLE |
| `CYC-004` | EcoRide Single-Speed | Sports Complex Stand | AVAILABLE |
| `CYC-005` | Campus Cruiser Pro V2 | Cafeteria Junction | AVAILABLE |
| `CYC-006` | EcoRide Single-Speed | Academic Block B | AVAILABLE |
| `CYC-007` | Campus Cruiser Pro V2 | Workshop Depot | MAINTENANCE |
| `CYC-008` | EcoRide Single-Speed | Main Gate Station | AVAILABLE |

On the **Scan QR Code** page, you can:
1. Scan any generated QR tag with your mobile camera or webcam.
2. Click the quick-test buttons (`CYC-001`, `CYC-002`, `CYC-003`, `CYC-004`) to simulate scanning.
3. Visit the Admin **Fleet & QR Codes** page to view and download printable SVG/PNG tags.

---

## 💰 Rental Fare Formula

The backend computes the rental amount using server timestamps:

$$\text{Rental Amount} = \left(\frac{\text{Duration in Minutes}}{60}\right) \times \text{Hourly Rate}$$

- Rounded to 2 decimal places.
- Hourly rate snapshot is recorded at the moment the rental starts and remains unaffected by subsequent pricing revisions.
- Live client-side timer is purely a visual aid; all billing duration is derived from PostgreSQL server records.

---

## 🧪 Automated Testing

Run the automated integration test suite:
```bash
npm test
```
Verifies health checks, authentication, scan identification, rental locks, conflict rejection, return fare calculation, payment verification, and admin metrics.
