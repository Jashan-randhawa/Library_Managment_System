import { Router } from "express";
import {
  getFines,
  getFine,
  createFine,
  payFine,
  waiveFine,
  getFinesSummary,
} from "../controllers/fineController";

const router = Router();

router.get("/summary", getFinesSummary);
router.get("/", getFines);
router.get("/:id", getFine);
router.post("/", createFine);
router.put("/:id/pay", payFine);
router.put("/:id/waive", waiveFine);

export default router;
