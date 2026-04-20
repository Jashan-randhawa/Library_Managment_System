import { Router } from "express";
import {
  getDashboardStats,
  getLoansByMonth,
  getLoansByGenre,
  getRecentLoans,
  getLowStockBooks,
} from "../controllers/dashboardController";

const router = Router();

router.get("/stats", getDashboardStats);
router.get("/loans-by-month", getLoansByMonth);
router.get("/loans-by-genre", getLoansByGenre);
router.get("/recent-loans", getRecentLoans);
router.get("/low-stock", getLowStockBooks);

export default router;
