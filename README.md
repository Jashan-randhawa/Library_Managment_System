# LibraryOS — Full Stack Library Management System

A complete, production-ready Library Management System built with **React + TypeScript** on the frontend and **Express + MongoDB** on the backend. Supports book cataloging, member management, loan tracking, reservations, fine collection, and JWT-based staff authentication.

**Live Demo:**
- Frontend: `https://your-app.vercel.app`
- Backend API: `https://libraryos-backend.onrender.com`

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Authentication](#authentication)
- [API Reference](#api-reference)
- [Database Models](#database-models)
- [Deployment Guide](#deployment-guide)
- [Troubleshooting](#troubleshooting)

---

## Features

- **Dashboard** — Live stats, loan charts by month and genre, low-stock alerts, recent activity
- **Book Management** — Full catalog CRUD with genre filtering, search, and availability tracking
- **Member Management** — Member profiles with membership type, status, and loan/fine history
- **Loan Tracking** — Issue and return books; auto-detects overdue loans on every fetch
- **Reservations** — Queue-based book holds with position tracking; auto-reorders on fulfill/cancel
- **Fines** — Auto-generated on overdue return at $0.50/day; supports pay and waive actions
- **Staff Authentication** — JWT-based login; admin and librarian roles
- **User Management** — Admins can create, view, and deactivate staff accounts
- **Rate Limiting** — Login endpoint limited to 10 attempts per 15 minutes; API at 200 req/min

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 + TypeScript | UI framework |
| Vite | Build tool and dev server |
| Tailwind CSS | Styling |
| React Router v7 | Client-side routing |
| Recharts | Dashboard charts |
| Lucide React | Icons |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express | API server |
| TypeScript | Type safety |
| Mongoose | MongoDB ODM |
| JSON Web Tokens (JWT) | Authentication |
| bcryptjs | Password hashing |
| express-rate-limit | Rate limiting |
| dotenv | Environment config |

### Database
| Technology | Purpose |
|------------|---------|
| MongoDB Atlas | Cloud database (production) |
| MongoDB local | Development database |

---

## Project Structure

```
Library_Management_System/
│
├── frontend/                         # React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                   # Reusable UI components (Button, Card, Table, etc.)
│   │   │   ├── Layout.tsx            # Sidebar + page shell
│   │   │   ├── ProtectedRoute.tsx    # Redirects to /login if unauthenticated
│   │   │   └── Toast.tsx             # Toast notification system
│   │   ├── context/
│   │   │   └── AuthContext.tsx       # Global auth state + token management
│   │   ├── lib/
│   │   │   └── utils.ts              # Date formatting, helpers
│   │   ├── pages/
│   │   │   ├── Login.tsx             # Login page
│   │   │   ├── Dashboard.tsx         # Stats, charts, recent activity
│   │   │   ├── Books.tsx             # Book catalog
│   │   │   ├── Members.tsx           # Member management
│   │   │   ├── Loans.tsx             # Loan tracking
│   │   │   ├── Reservations.tsx      # Reservation queue
│   │   │   ├── Fines.tsx             # Fine collection
│   │   │   └── Users.tsx             # Staff user management (admin only)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example                  # Frontend env template
│   └── vite.config.ts                # Vite config (proxy for local dev)
│
└── backend/                          # Express + TypeScript API
    ├── src/
    │   ├── config/
    │   │   └── database.ts           # MongoDB connection with caching
    │   ├── controllers/
    │   │   ├── authController.ts     # login, logout, getMe
    │   │   ├── bookController.ts     # Book CRUD
    │   │   ├── memberController.ts   # Member CRUD
    │   │   ├── loanController.ts     # Loan issue/return
    │   │   ├── reservationController.ts
    │   │   ├── fineController.ts     # Fine pay/waive
    │   │   ├── dashboardController.ts
    │   │   └── userController.ts     # Staff user CRUD (admin only)
    │   ├── middleware/
    │   │   ├── auth.ts               # JWT authenticate + authorizeAdmin
    │   │   ├── errorHandler.ts       # Global 404 + error handler
    │   │   └── logger.ts             # Request logger
    │   ├── models/
    │   │   ├── User.ts               # Staff user model (bcrypt password)
    │   │   ├── Book.ts
    │   │   ├── Member.ts
    │   │   ├── Loan.ts
    │   │   ├── Reservation.ts
    │   │   └── Fine.ts
    │   ├── routes/
    │   │   ├── auth.ts               # POST /login, POST /logout, GET /me
    │   │   ├── users.ts              # Staff user routes (admin only)
    │   │   ├── books.ts
    │   │   ├── members.ts
    │   │   ├── loans.ts
    │   │   ├── reservations.ts
    │   │   ├── fines.ts
    │   │   └── dashboard.ts
    │   ├── seed/
    │   │   ├── seed.ts               # Seeds books, members, loans, reservations, fines
    │   │   └── seedAdmin.ts          # Seeds default admin account
    │   ├── app.ts                    # Express app setup (CORS, middleware, routes)
    │   └── index.ts                  # Server entry point
    ├── dist/                         # Compiled JS (generated by tsc)
    ├── .env.example                  # Backend env template
    ├── package.json
    └── tsconfig.json
```

---

## Local Development Setup

### Prerequisites

- Node.js 18+
- MongoDB running locally on port `27017`
  - Install: https://www.mongodb.com/docs/manual/installation/
  - Or use [MongoDB Atlas](https://www.mongodb.com/atlas) free tier

### 1. Clone the repository

```bash
git clone https://github.com/your-username/library-management-system.git
cd library-management-system
```

### 2. Install dependencies

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 3. Configure environment variables

**Backend** — create `backend/.env`:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/libraryos
NODE_ENV=development
JWT_SECRET=your-local-dev-secret-change-in-production
FRONTEND_URL=http://localhost:5000
```

**Frontend** — for local dev, no `.env` is needed. The Vite dev server proxies `/api` requests to `localhost:3001` automatically via `vite.config.ts`.

### 4. Seed the database

```bash
# From the backend directory
npm run seed          # Seeds books, members, loans, reservations, fines
npm run seed:admin    # Creates default admin account
```

Default admin credentials (change after first login):
- **Email:** `admin@library.com`
- **Password:** `admin123`

### 5. Start development servers

In two separate terminals:

```bash
# Terminal 1 — Backend
cd backend && npm run dev
# Runs on http://localhost:3001

# Terminal 2 — Frontend
cd frontend && npm run dev
# Runs on http://localhost:5000
```

Open http://localhost:5000 and log in with the admin credentials.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | Port the API server listens on |
| `MONGODB_URI` | **Yes** | — | MongoDB connection string |
| `JWT_SECRET` | **Yes** | — | Secret key for signing JWT tokens (min 32 chars) |
| `NODE_ENV` | No | `development` | Set to `production` on Render |
| `FRONTEND_URL` | **Yes** | — | Allowed CORS origin (your Vercel URL in production) |

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | **Yes (production)** | `""` | Backend base URL — e.g. `https://libraryos-backend.onrender.com` |

> In local development `VITE_API_URL` is not needed — Vite proxies `/api` to localhost automatically.

---

## Authentication

### How it works

1. User submits email + password to `POST /api/auth/login`
2. Server validates credentials, returns a signed JWT (expires in 2 hours)
3. Frontend stores the token in `localStorage` under key `libraryos_token`
4. Every subsequent request includes `Authorization: Bearer <token>` header
5. Protected routes verify the token via the `authenticate` middleware

### Roles

| Role | Permissions |
|------|------------|
| `admin` | Full access — all modules + staff user management |
| `librarian` | Books, Members, Loans, Reservations, Fines — no user management |

### Token flow

```
Login → POST /api/auth/login
         ↓ returns JWT
Store in localStorage
         ↓
On app load → GET /api/auth/me (validates token, loads user)
         ↓
All API calls → Authorization: Bearer <token>
```

---

## API Reference

### Base URL
- **Local:** `http://localhost:3001/api`
- **Production:** `https://libraryos-backend.onrender.com/api`

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/login` | ❌ | Login with email + password |
| `POST` | `/auth/logout` | ❌ | Logout (client clears token) |
| `GET` | `/auth/me` | ✅ | Get current logged-in user |

**POST `/auth/login` body:**
```json
{ "email": "admin@library.com", "password": "admin123" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "user": { "_id": "...", "name": "Admin", "email": "admin@library.com", "role": "admin" }
  }
}
```

---

### Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | ❌ | Server health check |

---

### Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/dashboard/stats` | ✅ | Total books, members, active loans, unpaid fines |
| `GET` | `/dashboard/loans-by-month` | ✅ | Loan count for the last 6 months |
| `GET` | `/dashboard/loans-by-genre` | ✅ | Loans grouped by book genre |
| `GET` | `/dashboard/recent-loans` | ✅ | Last 5 loans with book + member info |
| `GET` | `/dashboard/low-stock` | ✅ | Books with ≤ 1 copy available |

---

### Books

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/books` | ✅ | List all books |
| `GET` | `/books/:id` | ✅ | Get a single book |
| `POST` | `/books` | ✅ | Add a new book |
| `PUT` | `/books/:id` | ✅ | Update a book |
| `DELETE` | `/books/:id` | ✅ | Delete a book |

**Query params for `GET /books`:** `search`, `genre`, `page`, `limit`

**POST/PUT body fields:** `title`, `author`, `isbn`, `genre`, `publishedYear`, `totalCopies`, `availableCopies`, `description`

---

### Members

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/members` | ✅ | List all members |
| `GET` | `/members/:id` | ✅ | Get member + loan + fine history |
| `POST` | `/members` | ✅ | Add a new member |
| `PUT` | `/members/:id` | ✅ | Update a member |
| `DELETE` | `/members/:id` | ✅ | Delete a member |

**Query params for `GET /members`:** `search`, `status`, `membershipType`, `page`, `limit`

---

### Loans

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/loans` | ✅ | List all loans |
| `GET` | `/loans/:id` | ✅ | Get a single loan |
| `POST` | `/loans` | ✅ | Issue a book to a member |
| `PUT` | `/loans/:id/return` | ✅ | Return a book (auto-generates fine if overdue) |
| `PUT` | `/loans/:id` | ✅ | Update loan details |

**POST `/loans` body:**
```json
{ "bookId": "...", "memberId": "...", "dueDays": 14 }
```
> `dueDays` is optional — defaults to 14 days.

> ⚠️ Returning an overdue book **automatically creates a fine** at **$0.50/day**.

---

### Reservations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/reservations` | ✅ | List all reservations |
| `GET` | `/reservations/:id` | ✅ | Get a single reservation |
| `POST` | `/reservations` | ✅ | Create a reservation |
| `PUT` | `/reservations/:id/fulfill` | ✅ | Fulfill a reservation |
| `PUT` | `/reservations/:id/cancel` | ✅ | Cancel a reservation |

---

### Fines

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/fines` | ✅ | List all fines |
| `GET` | `/fines/summary` | ✅ | Aggregated totals (paid vs unpaid) |
| `GET` | `/fines/:id` | ✅ | Get a single fine |
| `POST` | `/fines` | ✅ | Create a fine manually |
| `PUT` | `/fines/:id/pay` | ✅ | Mark fine as paid |
| `PUT` | `/fines/:id/waive` | ✅ | Waive a fine |

---

### Staff Users *(Admin only)*

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/users` | ✅ Admin | List all staff accounts |
| `POST` | `/users` | ✅ Admin | Create a new staff account |
| `DELETE` | `/users/:id` | ✅ Admin | Deactivate a staff account |

**POST `/users` body:**
```json
{ "name": "Jane Smith", "email": "jane@library.com", "password": "secure123", "role": "librarian" }
```

---

## Database Models

### User
| Field | Type | Notes |
|-------|------|-------|
| `name` | String | Required |
| `email` | String | Required, unique, lowercase |
| `password` | String | Bcrypt hashed (salt rounds: 12) |
| `role` | Enum | `admin` or `librarian` |
| `isActive` | Boolean | Default: true |
| `createdBy` | ObjectId | Ref: User |

### Book
| Field | Type | Notes |
|-------|------|-------|
| `title` | String | Required |
| `author` | String | Required |
| `isbn` | String | Unique |
| `genre` | String | |
| `publishedYear` | Number | |
| `totalCopies` | Number | |
| `availableCopies` | Number | Decremented on loan |

### Member
| Field | Type | Notes |
|-------|------|-------|
| `name` | String | Required |
| `email` | String | Required, unique |
| `phone` | String | |
| `membershipType` | Enum | `basic`, `premium`, `student` |
| `status` | Enum | `active`, `suspended`, `expired` |
| `membershipExpiry` | Date | |

### Loan
| Field | Type | Notes |
|-------|------|-------|
| `book` | ObjectId | Ref: Book |
| `member` | ObjectId | Ref: Member |
| `issueDate` | Date | |
| `dueDate` | Date | |
| `returnDate` | Date | Set on return |
| `status` | Enum | `active`, `returned`, `overdue` |

### Reservation
| Field | Type | Notes |
|-------|------|-------|
| `book` | ObjectId | Ref: Book |
| `member` | ObjectId | Ref: Member |
| `queuePosition` | Number | Auto-managed |
| `status` | Enum | `pending`, `fulfilled`, `cancelled` |

### Fine
| Field | Type | Notes |
|-------|------|-------|
| `member` | ObjectId | Ref: Member |
| `loan` | ObjectId | Ref: Loan |
| `amount` | Number | Auto-calculated ($0.50/day) |
| `reason` | String | |
| `status` | Enum | `unpaid`, `paid`, `waived` |
| `paidAt` | Date | Set on payment |

---

## Deployment Guide

### Backend on Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repository, select the `backend` folder as root
4. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Node Version:** 18+
5. Add Environment Variables:
   ```
   MONGODB_URI     = mongodb+srv://<user>:<password>@cluster.mongodb.net/libraryos
   JWT_SECRET      = <run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
   NODE_ENV        = production
   FRONTEND_URL    = https://your-app.vercel.app
   PORT            = 5000
   ```
6. Deploy. Once live, open the Render **Shell** tab and run:
   ```bash
   npm run seed:admin
   ```
   This creates the default admin account.

### Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repository
3. Set **Root Directory** to `frontend`
4. Add Environment Variable:
   ```
   VITE_API_URL = https://your-backend.onrender.com
   ```
   *(no trailing slash, no `/api`)*
5. Deploy.

### MongoDB Atlas Setup

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → Create free cluster
2. Database Access → Add user with password
3. Network Access → Allow access from anywhere (`0.0.0.0/0`) for Render
4. Clusters → Connect → Drivers → copy the connection string
5. Replace `<password>` in the string and use it as `MONGODB_URI` on Render

---

## Troubleshooting

### `500` on `/api/auth/login` or `/api/auth/me`

The two most common causes:

**Missing `JWT_SECRET` on Render**
The login controller throws if this is not set. Verify it exists in Render → Environment.

**Missing or incorrect `MONGODB_URI`**
If MongoDB can't connect, all DB queries throw and return 500. Check the Render logs for `MongoDB connection error`.

To verify: hit `https://libraryos-backend.onrender.com/api/health` — if this returns `200`, the server is up. If login still fails, it's an env var issue.

---

### CORS error in the browser

Make sure `FRONTEND_URL` on Render exactly matches your Vercel URL including `https://` and without a trailing slash.

```
FRONTEND_URL=https://your-app.vercel.app   ✅
FRONTEND_URL=https://your-app.vercel.app/  ❌ (trailing slash)
FRONTEND_URL=your-app.vercel.app           ❌ (missing https://)
```

---

### Frontend calls going to Vercel instead of Render

If you see the browser calling `https://your-app.vercel.app/api/...` instead of the Render backend, `VITE_API_URL` is not set in Vercel. Go to Vercel → Project → Settings → Environment Variables and add it, then redeploy.

---

### Login works but data doesn't load

Check that other API routes are actually protected correctly. All routes except `/api/auth/login` and `/api/health` require a valid Bearer token. If the token expired (2-hour lifetime), log out and log back in.

---

### `npm run build` fails on Render

Make sure `typescript` is in `dependencies` (not just `devDependencies`) in `backend/package.json`, since Render installs only production deps by default unless you set `NODE_ENV=development` during build.

Alternatively, set the build command to:
```bash
npm install --include=dev && npm run build
```

---

## Scripts Reference

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload (ts-node + nodemon) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run compiled production build from `dist/index.js` |
| `npm run seed` | Seed books, members, loans, reservations, fines |
| `npm run seed:admin` | Create default admin account (`admin@library.com` / `admin123`) |

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server on port 5000 |
| `npm run build` | Build for production to `dist/` |
| `npm run preview` | Preview production build locally |

---

## License

MIT
