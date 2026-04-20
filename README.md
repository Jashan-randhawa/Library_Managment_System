# LibraryOS — Full Stack Library Management System

A complete Library Management System with **React + TypeScript** frontend and **Express + MongoDB** backend — fully integrated and ready to run.

---

## 🚀 Quick Start (3 steps)

### 1. Install all dependencies
```bash
npm run install:all
```

### 2. Seed the database
```bash
npm run seed
```
> Make sure MongoDB is running locally on port 27017 first.
> To install MongoDB: https://www.mongodb.com/docs/manual/installation/

### 3. Start both servers
```bash
npm run dev
```

This starts:
- **Backend API** → http://localhost:5000
- **Frontend** → http://localhost:5173

---

## 📁 Project Structure

```
libraryos-fullstack/
├── package.json          ← Root: run both servers together
├── frontend/             ← React + TypeScript + Vite + Tailwind
│   ├── src/
│   │   ├── pages/        ← Dashboard, Books, Members, Loans, Reservations, Fines
│   │   ├── components/   ← Layout, UI components
│   │   ├── lib/
│   │   │   ├── api.ts    ← API client (all HTTP calls)
│   │   │   └── utils.ts  ← Helpers
│   │   └── types/        ← TypeScript interfaces
│   └── vite.config.ts    ← Proxies /api → localhost:5000
│
└── backend/              ← Express + TypeScript + MongoDB
    ├── src/
    │   ├── models/       ← Book, Member, Loan, Reservation, Fine
    │   ├── controllers/  ← Business logic for each entity
    │   ├── routes/       ← REST API routes
    │   ├── middleware/   ← Error handler, request logger
    │   ├── config/       ← MongoDB connection
    │   ├── seed/         ← Database seeder
    │   └── index.ts      ← Express server entry point
    └── .env              ← MongoDB URI, port config
```

---

## 🔌 API Endpoints

| Module        | Endpoints                                           |
|---------------|-----------------------------------------------------|
| Dashboard     | `GET /api/dashboard/stats`, `/loans-by-month`, `/loans-by-genre`, `/recent-loans`, `/low-stock` |
| Books         | `GET/POST /api/books`, `GET/PUT/DELETE /api/books/:id` |
| Members       | `GET/POST /api/members`, `GET/PUT/DELETE /api/members/:id` |
| Loans         | `GET/POST /api/loans`, `PUT /api/loans/:id/return`  |
| Reservations  | `GET/POST /api/reservations`, `PUT /api/reservations/:id/fulfill|cancel` |
| Fines         | `GET/POST /api/fines`, `PUT /api/fines/:id/pay|waive` |

---

## ⚙️ Configuration

**Backend** (`backend/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/libraryos
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`) — no changes needed, Vite proxies `/api` automatically.

---

## 🌱 Seeded Data

Running `npm run seed` populates:
- 📚 12 books across 6 genres
- 👥 8 members (active, suspended, expired)
- 📖 8 loans (active, overdue, returned)
- 📅 5 reservations with queue positions
- 💰 6 fines (paid, unpaid)

---

## 🧠 Key Features

- **Auto overdue detection** — loans past due date are marked overdue on every fetch
- **Auto fine generation** — returning an overdue book creates a fine at $0.50/day
- **Queue management** — reservation queue reorders on fulfill/cancel
- **Live stats** — dashboard pulls real data from MongoDB aggregations
- **Search + filters** — every page supports search and status filtering
