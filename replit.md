# LibraryOS - Full Stack Library Management System

## Overview
A comprehensive library management system built with React + Express + MongoDB. Features dashboards, book/member management, loans, reservations, and fines.

## Tech Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router v7, Recharts
- **Backend:** Node.js, Express, TypeScript, Mongoose (MongoDB ODM)
- **Database:** MongoDB (local, stored in /tmp/mongodb-data)

## Project Structure
```
libraryos-fullstack/
├── backend/          # Express API server (port 3001)
│   └── src/
│       ├── config/   # Database connection
│       ├── controllers/ # Business logic
│       ├── models/   # Mongoose schemas
│       ├── routes/   # API routes
│       └── seed/     # DB seeder
├── frontend/         # React Vite frontend (port 5000)
│   └── src/
│       ├── components/ # UI components
│       ├── pages/    # Dashboard, Books, Members, Loans, etc.
│       └── lib/      # API client
├── start.sh          # Startup script (MongoDB + backend + frontend)
└── replit.md         # This file
```

## Ports
- **Frontend:** port 5000 (webview)
- **Backend API:** port 3001
- **MongoDB:** port 27017 (local)

## Running the App
The workflow `Start application` runs `bash start.sh` which:
1. Starts MongoDB (stored in /tmp/mongodb-data)
2. Starts the backend (port 3001)
3. Starts the frontend (port 5000)

## API Endpoints
- `GET /api/health` - Health check
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/books` - Book catalog
- `GET /api/members` - Member list
- `GET /api/loans` - Active loans
- `GET /api/reservations` - Reservation queue
- `GET /api/fines` - Fines tracking

## Database Seeding
To seed the database with sample data:
```bash
cd backend && npm run seed
```
Seeds: 12 books, 8 members, 8 loans, 5 reservations, 6 fines

## Environment
- Backend env: `backend/.env` (PORT=3001, MONGODB_URI=mongodb://localhost:27017/libraryos)
- Frontend: Uses Vite proxy to forward `/api` requests to backend port 3001

## Authentication
- JWT-based auth with 7-day token expiry
- Token stored in `localStorage` under key `libraryos_token`
- All API routes (except `/api/auth/login`) require `Authorization: Bearer <token>` header
- **Default admin:** `admin@library.com` / `admin123` (auto-seeded on startup)
- Roles: `admin` (full access) and `librarian` (no user management)

## Staff User Management
- Admin-only `/users` route — list, create, and deactivate staff accounts
- Admins see "Staff Users" link in the sidebar; librarians do not
- Logout button in sidebar footer; shows real name and role

## New Backend Files
- `backend/src/models/User.ts` — User model with bcrypt password hashing
- `backend/src/middleware/auth.ts` — JWT authenticate + authorizeAdmin middlewares
- `backend/src/controllers/authController.ts` — login, logout, getMe
- `backend/src/controllers/userController.ts` — CRUD for staff users
- `backend/src/routes/auth.ts` — /api/auth/* routes
- `backend/src/routes/users.ts` — /api/users/* routes (admin only)
- `backend/src/seed/seedAdmin.ts` — seeds default admin (runs on startup)

## New Frontend Files
- `frontend/src/context/AuthContext.tsx` — global auth state + token management
- `frontend/src/components/ProtectedRoute.tsx` — redirects to /login if unauthenticated
- `frontend/src/pages/Login.tsx` — dark-themed login page
- `frontend/src/pages/Users.tsx` — staff user management page (admin only)

## Key Configuration
- `frontend/vite.config.ts`: host 0.0.0.0, port 5000, allowedHosts true, proxy /api → localhost:3001
- `backend/src/index.ts`: listens on PORT env var (default 3001)
- `backend/.env`: JWT_SECRET, PORT=3001, MONGODB_URI
