# LibraryOS — Library Management System

A full-featured Library Management System built with **React + TypeScript + Vite + Tailwind CSS**.

## Features

- 📊 **Dashboard** — Statistics overview with charts (loans over time, genre distribution)
- 📚 **Books** — Full catalog with search, genre filter, availability tracking, add new books
- 👥 **Members** — Member management with status/membership type filtering, add new members
- 📖 **Loans** — Active/overdue/returned loans, mark books as returned
- 📅 **Reservations** — Queue-based reservation system, fulfill or cancel reservations
- 💰 **Fines** — Fine tracking, mark as paid or waive

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS v3
- React Router v6
- Recharts (dashboard charts)
- Lucide React (icons)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
src/
├── components/
│   ├── Layout.tsx          # Sidebar + main layout
│   └── ui/
│       └── index.tsx       # Reusable UI components
├── data/
│   └── mockData.ts         # Mock data for all entities
├── lib/
│   └── utils.ts            # Utility helpers
├── pages/
│   ├── Dashboard.tsx
│   ├── Books.tsx
│   ├── Members.tsx
│   ├── Loans.tsx
│   ├── Reservations.tsx
│   └── Fines.tsx
├── types/
│   └── index.ts            # TypeScript type definitions
├── App.tsx
└── main.tsx
```

## Connecting a Real Backend

Replace the mock data in `src/data/mockData.ts` with API calls to the Express backend (see `artifacts/api-server/`). The TypeScript interfaces in `src/types/index.ts` match the API schemas exactly.
