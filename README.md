# MessMate — Smart Digital Lunch Coupon Management System

> **Repository:** `Coupon_Generator_App-`  
> A production-grade, full-stack digital lunch coupon management platform for college campuses, replacing paper mess tokens with cryptographically verified QR passes, real-time counter validation, and operational analytics.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Objectives](#objectives)
3. [Key Features](#key-features)
4. [Technology Stack](#technology-stack)
5. [System Architecture](#system-architecture)
6. [Folder Structure](#folder-structure)
7. [Screenshots](#screenshots)
8. [Installation & Environment Setup](#installation--environment-setup)
9. [Database Setup & Seeding](#database-setup--seeding)
10. [Running the Application](#running-the-application)
11. [Authentication & Role-Based Access](#authentication--role-based-access)
12. [Coupon Lifecycle & Security Workflow](#coupon-lifecycle--security-workflow)
13. [REST API Reference](#rest-api-reference)
14. [Future Scope](#future-scope)
15. [Contributors](#contributors)

---

## Problem Statement

Traditional college mess facilities rely on paper lunch coupons or manual register signatures. This creates recurring operational issues:
- Paper wastage, lost tokens, and queue bottlenecks during peak lunch hours.
- Coupon duplication, sharing, or reuse without an audit trail.
- Lack of real-time visibility into daily meal demand, redemption rates, and student participation.

**MessMate** digitizes the entire workflow with unique daily QR coupons, atomic server-side redemption locking, and live administrative dashboards.

---

## Objectives

- Eliminate paper coupons with a self-service student web portal.
- Enforce a strict **one lunch coupon per student per day** rule at both API and MongoDB index levels.
- Provide mess administrators with live camera QR scanning and instant manual verification.
- Prevent duplicate coupon redemptions and forged QR codes via server-side HMAC verification tokens.
- Deliver real-time analytics, student account controls, and dynamic daily menu management.

---

## Key Features

### Student Portal
- **Authentication & Onboarding:** Registration with Full Name, Roll Number / Student ID, College Email, Department, and Semester; secure JWT login.
- **Personal Dashboard:** Personalized greeting, coupon KPIs (Total Generated, Redeemed, Active, Current Meal), one-click daily lunch coupon generation, and recent activity.
- **Digital QR Lunch Pass:** Unique coupon ID (`MM-YYYYMMDD-XXXXXX`), QR code encoding only `{ couponId, token }` (no PII exposed), validity window, and print support.
- **Coupon History:** Filter by `All`, `Active`, `Redeemed`, or `Expired`, search by Coupon ID, and inspect any historical pass.
- **Today's Mess Menu:** Dynamic Monday–Sunday **ABES Boys' Hostel** weekly schedule resolved automatically from any selected date, showing Breakfast, Lunch, Snacks, and Dinner cards with timings, active-meal highlighting, and dietary indicators.
- **Profile & Settings:** Update academic profile (with locked Student ID), change password, and view account status.
- **Notifications:** Real-time notification bell with unread badge, mark-as-read, and mark-all-as-read support.

### Mess Administrator Console
- **Operations Overview:** Live metrics from MongoDB (Registered Students, Generated Today, Redeemed Today, Pending, Expired) with 7-day trend and status distribution charts.
- **QR Code Scanner:** Live device camera scanning (`jsQR` + `getUserMedia`), QR image upload fallback, and manual Coupon ID lookup with instant status checks (`VALID`, `ALREADY_REDEEMED`, `EXPIRED`, `INVALID`).
- **One-Tap Atomic Redemption:** Confirms meal redemption, timestamps `redeemedAt`, records `redeemedBy`, notifies the student, and locks the coupon against reuse.
- **Student Management:** Search by name, student ID, or email; filter by department or semester; inspect coupon history; activate or deactivate accounts.
- **Coupon Management:** Search and filter all issued coupons by status, date, or student, with full audit inspection.
- **Menu Management:** Weekly Monday-to-Sunday hostel menu editor to add/remove food items, edit meal timings, and publish or unpublish meals with automatic student notifications.
- **Analytics:** Interactive Recharts reports across 7/14/30-day windows, department participation, and peak redemption hours.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, React Router DOM, Axios, Lucide React, Recharts, `qrcode.react`, `jsqr`, React Hot Toast |
| **Backend** | Node.js, Express 5, Mongoose 9, JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `helmet`, `cors`, `cookie-parser`, `express-rate-limit`, `express-validator`, `morgan` |
| **Database** | MongoDB (indexed schemas for Users, Coupons, Menus, and Notifications) |

---

## System Architecture

```text
┌────────────────────────┐         HTTPS / JSON + JWT          ┌──────────────────────────┐
│   React + Vite SPA     │ ◄─────────────────────────────────► │   Express.js REST API    │
│   (Student & Admin UI) │   Bearer Token / HttpOnly Cookie    │   Auth • RBAC • Limits   │
└────────────────────────┘                                     └────────────┬─────────────┘
                                                                            │ Mongoose ODM
                                                                            ▼
                                                               ┌──────────────────────────┐
                                                               │         MongoDB          │
                                                               │ Users • Coupons • Menus  │
                                                               │      Notifications       │
                                                               └──────────────────────────┘
```

---

## Folder Structure

```text
Coupon_Generator_App-/
├── public/
├── src/
│   ├── components/
│   │   ├── common/          # StatusBadge, Card, StatCard, Controls, NotificationDropdown, ProtectedRoute
│   │   └── coupons/         # CouponTicket with QRCodeSVG
│   ├── context/             # AuthContext
│   ├── hooks/               # useDebounce
│   ├── layouts/             # StudentLayout, AdminLayout
│   ├── pages/
│   │   ├── auth/            # Login, Register
│   │   ├── student/         # Dashboard, MyCoupon, CouponHistory, Menu, Profile, Settings
│   │   └── admin/           # AdminDashboard, Scanner, Students, Coupons, MenuManagement, Analytics
│   ├── services/            # Centralized Axios client & domain API services
│   ├── utils/               # Date, currency/text formatters, error extractors
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── server/
│   ├── src/
│   │   ├── config/          # MongoDB connection (db.js)
│   │   ├── controllers/     # auth, student, coupon, admin, notification controllers
│   │   ├── middleware/      # JWT auth, role guard, validation, body sanitizer, error handler
│   │   ├── models/          # User, Coupon, Menu, Notification Mongoose schemas
│   │   ├── routes/          # REST API route definitions
│   │   ├── scripts/         # createAdmin.js & seed.js
│   │   ├── services/        # couponService, notificationService
│   │   ├── utils/           # couponCrypto (HMAC/QR parser), dateUtils, errors
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── .env.example
├── package.json
└── README.md
```

---

## Screenshots

> Add screenshots of your local deployment in a `docs/screenshots/` folder after running the app:
- `Student Dashboard` — Welcome overview, KPI cards, and Today's Lunch Coupon generator
- `Digital QR Coupon Pass` — High-contrast QR pass with unique `MM-YYYYMMDD-XXXXXX` code
- `Admin QR Scanner` — Live camera viewfinder with real-time verification & redemption lock
- `Admin Analytics` — 14-day generation vs redemption chart, department breakdown, and peak hours

---

## Installation & Environment Setup

### 1. Prerequisites
- **Node.js** v20+ and **npm** v10+
- **MongoDB** (Local MongoDB Community Server on `127.0.0.1:27017` or a MongoDB Atlas cluster URI)

### 2. Install Dependencies
From the repository root (`Coupon_Generator_App-`):

```bash
# Install frontend & root workspace dependencies
npm install

# Install backend dependencies
npm --prefix server install
```

### 3. Configure Environment Variables

Create the frontend environment file from `.env.example`:
```bash
cp .env.example .env
```
Contents of `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

Create the backend environment file from `server/.env.example`:
```bash
cp server/.env.example server/.env
```
Contents of `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/messmate
JWT_SECRET=replace_with_a_strong_64_char_random_secret_string
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
COUPON_SECRET=replace_with_a_strong_coupon_hmac_secret_string
```

> **Note for MongoDB Atlas:** Replace `MONGODB_URI` with your `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/messmate?retryWrites=true&w=majority` connection string.

---

## Database Setup & Seeding

### 1. Create an Administrator Account (Secure CLI Procedure)
Admin credentials are **never** hardcoded into the frontend. Create your mess admin account securely from the backend directory:

```bash
cd server
node src/scripts/createAdmin.js --name "Mess Administrator" --email "admin@yourdomain.edu" --password "YourStrongPassword"
```
*(You can also run `npm run admin:create` from the root or `server/` to be prompted interactively.)*

### 2. Seed Sample Data (Optional for Demo/Testing)
Populate sample students, 10 days of historical coupons, 8 days of varied daily meal menus (today + next 7 days), and notifications:

```bash
# From repository root (full seed):
npm run seed

# Or seed only the 8-day varied menus (today + next 7 days):
npm run seed:menus

# Or seed the official ABES Boys' Hostel Monday–Sunday weekly menu:
npm run seed:weekly-menu
```
The seed script is idempotent and safe to run multiple times without creating duplicate students or menus.

---

## Running the Application

### Run Both Frontend & Backend Concurrently (Recommended)
From the repository root (`Coupon_Generator_App-`):
```bash
npm run dev
```
- **Frontend (Vite):** `http://localhost:5173`
- **Backend (Express API):** `http://localhost:5000/api`

### Run Separately
```bash
# Terminal 1 — Backend (from server/ directory or using --prefix)
cd server
npm run dev

# Terminal 2 — Frontend (from repository root)
npm run dev:client
```

### Production Build
```bash
npm run build
```

---

## Authentication & Role-Based Access

- **Passwords:** Hashed with `bcryptjs` (salt rounds: 12); `passwordHash` is excluded from queries and JSON serialization.
- **Sessions:** Signed JWTs delivered both in an `HttpOnly` cookie and `Authorization: Bearer <token>` header.
- **Roles:**
  - `student` — Restricted to `/student/*` routes and `/api/student/*` endpoints. Cannot redeem coupons or access admin APIs.
  - `admin` — Restricted to `/admin/*` console and `/api/admin/*` + `/api/coupons/verify|redeem` endpoints.
- **Rate Limiting & Hardening:** Strict rate limiting on `/api/auth/login` and `/api/auth/register`, `helmet` HTTP headers, CORS origin whitelist, and recursive body key sanitization against NoSQL operator injection.

---

## Coupon Lifecycle & Security Workflow

1. **Generation:** Authenticated student clicks **Generate Lunch Coupon** (`POST /api/student/coupons/generate`).
2. **Duplicate Prevention:** Backend checks existing coupons for `{ student, couponDate, mealType }` AND enforces a unique MongoDB compound index on `{ student: 1, couponDate: 1, mealType: 1 }`.
3. **Cryptographic Issuance:** Server generates a non-predictable Coupon ID (`MM-YYYYMMDD-XXXXXX`) and an HMAC-SHA256 verification token (`nonce.hmac`), expiring at `23:59:59` of `couponDate`.
4. **QR Rendering:** Frontend renders a QR code encoding `{"couponId":"...","token":"..."}` without exposing student PII.
5. **Counter Verification:** Admin scans the QR via camera (or image upload / manual ID) (`POST /api/coupons/verify`). Server checks existence, timing-safe token equality, active student status, expiration, and redemption status.
6. **Atomic Redemption:** Admin confirms redemption (`POST /api/coupons/redeem`). MongoDB performs an atomic `findOneAndUpdate` requiring `status: 'ACTIVE'` and `expiresAt > now`, locking out concurrent or repeat redemptions and notifying the student.

---

## REST API Reference

### Auth
- `POST /api/auth/register` — Register a new student account
- `POST /api/auth/login` — Authenticate student or admin
- `POST /api/auth/logout` — Clear auth cookie
- `GET /api/auth/me` — Get authenticated user profile

### Student
- `GET /api/student/dashboard` — Dashboard stats, today's coupon, recent activity, today's lunch menu
- `GET /api/student/profile` — Fetch current student profile
- `PUT /api/student/profile` — Update name, email, department, or semester
- `PUT /api/student/password` — Change password
- `GET /api/student/coupons` — Paginated coupon history with status filter & search
- `GET /api/student/coupons/today` — Fetch today's lunch coupon if generated
- `POST /api/student/coupons/generate` — Generate today's unique lunch coupon
- `GET /api/student/menu` — Fetch mess menu by date (`?date=YYYY-MM-DD`)

### Coupons (Verification & Redemption)
- `GET /api/coupons/:couponId` — Inspect coupon (owner or admin)
- `POST /api/coupons/verify` — Verify QR payload / coupon ID (Admin only)
- `POST /api/coupons/redeem` — Atomically redeem active coupon (Admin only)

### Admin
- `GET /api/admin/dashboard` — Live statistics, 7-day trend, status breakdown, recent activity
- `GET /api/admin/students` — Paginated student directory with search & filters
- `GET /api/admin/students/:id` — Student profile + coupon history
- `PATCH /api/admin/students/:id/status` — Activate or deactivate a student account
- `GET /api/admin/coupons` — Filterable coupon audit log
- `GET /api/admin/analytics` — Multi-day series, department stats, hourly peak distribution
- `GET /api/admin/menu` — List published date menus
- `POST /api/admin/menu` — Publish meal menu
- `PUT /api/admin/menu/:id` — Update existing menu
- `DELETE /api/admin/menu/:id` — Remove menu
- `GET /api/admin/weekly-menu` — List complete Monday–Sunday ABES weekly hostel menu
- `PUT /api/admin/weekly-menu/slot` — Upsert a weekday meal slot
- `PUT /api/admin/weekly-menu/:id` — Update items, timings, or publish status for a weekly meal
- `PATCH /api/admin/weekly-menu/:id/publish` — Publish or unpublish a weekly meal slot

### Notifications
- `GET /api/notifications` — List user notifications and unread count
- `PATCH /api/notifications/:id/read` — Mark a notification as read
- `PATCH /api/notifications/read-all` — Mark all notifications as read

---

## Future Scope

- Multi-meal coupon generation (Breakfast, Lunch, Dinner) with configurable campus meal plans.
- Automated monthly mess billing & rebate calculation for unredeemed days.
- Push notifications / WebSocket live feed at the dining counter.
- Exportable CSV / PDF monthly audit reports for hostel administration.

---

## Contributors

- **MessMate Engineering Team** — Full-Stack Architecture, Security, UI/UX, and QA.
