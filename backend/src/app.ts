import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { requestLogger } from "./middleware/logger";
import { notFound, errorHandler } from "./middleware/errorHandler";
import { authenticate } from "./middleware/auth";

// Routes
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import bookRoutes from "./routes/books";
import memberRoutes from "./routes/members";
import loanRoutes from "./routes/loans";
import reservationRoutes from "./routes/reservations";
import fineRoutes from "./routes/fines";
import dashboardRoutes from "./routes/dashboard";

dotenv.config();

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ["http://localhost:5000", "http://localhost:5173"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ─── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "LibraryOS API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ─── Public Routes ─────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);

// ─── Protected Routes ──────────────────────────────────────────────────────────
app.use("/api/users", userRoutes);
app.use("/api/dashboard", authenticate, dashboardRoutes);
app.use("/api/books", authenticate, bookRoutes);
app.use("/api/members", authenticate, memberRoutes);
app.use("/api/loans", authenticate, loanRoutes);
app.use("/api/reservations", authenticate, reservationRoutes);
app.use("/api/fines", authenticate, fineRoutes);

// ─── Error Handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
