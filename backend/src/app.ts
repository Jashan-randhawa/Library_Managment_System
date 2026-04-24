import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
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

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ["http://localhost:5000", "http://localhost:5173", /\.replit\.dev$/, /\.repl\.co$/];

app.use(cors({ origin: allowedOrigins, credentials: true }));

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ─── Trust proxy (required on Render / behind load balancer) ─────────────────
app.set("trust proxy", 1);

// ─── Rate limiters ────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { success: false, message: "Too many requests, please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", apiLimiter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "LibraryOS API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ─── Public Routes ────────────────────────────────────────────────────────────
app.use("/api/auth", loginLimiter, authRoutes);

// ─── Protected Routes ─────────────────────────────────────────────────────────
app.use("/api/users", userRoutes);
app.use("/api/dashboard", authenticate, dashboardRoutes);
app.use("/api/books", authenticate, bookRoutes);
app.use("/api/members", authenticate, memberRoutes);
app.use("/api/loans", authenticate, loanRoutes);
app.use("/api/reservations", authenticate, reservationRoutes);
app.use("/api/fines", authenticate, fineRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
