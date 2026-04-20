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

## Key Configuration
- `frontend/vite.config.ts`: host 0.0.0.0, port 5000, allowedHosts true, proxy /api → localhost:3001
- `backend/src/index.ts`: listens on PORT env var (default 3001)
