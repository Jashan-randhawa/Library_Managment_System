# LibraryOS — MongoDB Backend API

A RESTful API built with **Express.js + TypeScript + MongoDB (Mongoose)** for the LibraryOS Library Management System.

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI
```

```bash
```

### 4. Start the dev server
```bash
npm run dev
```

Server runs at **http://localhost:5000**

---

## Environment Variables

| Variable       | Default                                   | Description              |
|----------------|-------------------------------------------|--------------------------|
| `PORT`         | `5000`                                    | API server port          |
| `MONGODB_URI`  | `mongodb://localhost:27017/libraryos`     | MongoDB connection string |
| `NODE_ENV`     | `development`                             | Environment mode         |
| `FRONTEND_URL` | `http://localhost:5173`                   | CORS allowed origin      |

---

## API Reference

### Health
| Method | Endpoint       | Description     |
|--------|----------------|-----------------|
| GET    | `/api/health`  | Health check    |

### Dashboard
| Method | Endpoint                          | Description                    |
|--------|-----------------------------------|--------------------------------|
| GET    | `/api/dashboard/stats`            | Summary statistics             |
| GET    | `/api/dashboard/loans-by-month`   | Loans chart (last 6 months)    |
| GET    | `/api/dashboard/loans-by-genre`   | Loans by genre                 |
| GET    | `/api/dashboard/recent-loans`     | Last 5 loans                   |
| GET    | `/api/dashboard/low-stock`        | Books with ≤1 copy available   |

### Books
| Method | Endpoint          | Description                  |
|--------|-------------------|------------------------------|
| GET    | `/api/books`      | List all books (with filters)|
| GET    | `/api/books/:id`  | Get single book              |
| POST   | `/api/books`      | Add new book                 |
| PUT    | `/api/books/:id`  | Update book                  |
| DELETE | `/api/books/:id`  | Delete book                  |

**Query params for GET /api/books:** `search`, `genre`, `page`, `limit`

### Members
| Method | Endpoint            | Description                    |
|--------|---------------------|--------------------------------|
| GET    | `/api/members`      | List all members (with filters)|
| GET    | `/api/members/:id`  | Get member + loans + fines     |
| POST   | `/api/members`      | Add new member                 |
| PUT    | `/api/members/:id`  | Update member                  |
| DELETE | `/api/members/:id`  | Delete member                  |

**Query params for GET /api/members:** `search`, `status`, `membershipType`, `page`, `limit`

### Loans
| Method | Endpoint                  | Description              |
|--------|---------------------------|--------------------------|
| GET    | `/api/loans`              | List all loans           |
| GET    | `/api/loans/:id`          | Get single loan          |
| POST   | `/api/loans`              | Issue a book             |
| PUT    | `/api/loans/:id/return`   | Return a book            |
| PUT    | `/api/loans/:id`          | Update loan              |

**POST /api/loans body:** `{ bookId, memberId, dueDays? }` (default dueDays: 14)

> Returning an overdue book **automatically generates a fine** at $0.50/day.

### Reservations
| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| GET    | `/api/reservations`             | List all reservations    |
| GET    | `/api/reservations/:id`         | Get single reservation   |
| POST   | `/api/reservations`             | Create reservation       |
| PUT    | `/api/reservations/:id/fulfill` | Fulfill reservation      |
| PUT    | `/api/reservations/:id/cancel`  | Cancel reservation       |

### Fines
| Method | Endpoint                  | Description             |
|--------|---------------------------|-------------------------|
| GET    | `/api/fines`              | List all fines          |
| GET    | `/api/fines/summary`      | Aggregated totals       |
| GET    | `/api/fines/:id`          | Get single fine         |
| POST   | `/api/fines`              | Create fine manually    |
| PUT    | `/api/fines/:id/pay`      | Mark fine as paid       |
| PUT    | `/api/fines/:id/waive`    | Waive fine              |

---

## Project Structure

```
src/
├── config/
│   └── database.ts          # MongoDB connection
├── controllers/
│   ├── bookController.ts
│   ├── memberController.ts
│   ├── loanController.ts
│   ├── reservationController.ts
│   ├── fineController.ts
│   └── dashboardController.ts
├── middleware/
│   ├── errorHandler.ts      # Global error handling + 404
│   └── logger.ts            # Request logger
├── models/
│   ├── Book.ts
│   ├── Member.ts
│   ├── Loan.ts
│   ├── Reservation.ts
│   └── Fine.ts
├── routes/
│   ├── books.ts
│   ├── members.ts
│   ├── loans.ts
│   ├── reservations.ts
│   ├── fines.ts
│   └── dashboard.ts
└── index.ts                 # App entry point
```

---

## MongoDB Collections

| Collection     | Description                                    |
|----------------|------------------------------------------------|
| `books`        | Library catalog with availability tracking     |
| `members`      | Library members with membership/status         |
| `loans`        | Issued books, auto-marked overdue on query     |
| `reservations` | Book holds queue with position tracking        |
| `fines`        | Overdue/damage fines, auto-generated on return |

---

## Connecting to the Frontend

Update `src/data/mockData.ts` in the frontend to use API calls, or create an `src/api/` layer:

```ts
// src/api/client.ts
const BASE = "http://localhost:5000/api";

export const api = {
  books:        { getAll: () => fetch(`${BASE}/books`).then(r => r.json()) },
  members:      { getAll: () => fetch(`${BASE}/members`).then(r => r.json()) },
  loans:        { getAll: () => fetch(`${BASE}/loans`).then(r => r.json()) },
  reservations: { getAll: () => fetch(`${BASE}/reservations`).then(r => r.json()) },
  fines:        { getAll: () => fetch(`${BASE}/fines`).then(r => r.json()) },
  dashboard:    { stats: () => fetch(`${BASE}/dashboard/stats`).then(r => r.json()) },
};
```

---

## Scripts

| Command         | Description                  |
|-----------------|------------------------------|
| `npm run dev`   | Dev server with hot reload   |
| `npm run build` | Compile TypeScript to `dist/`|
| `npm start`     | Run compiled production build|
