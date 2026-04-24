import { Router } from "express";
import {
  getLoans,
  getLoan,
  createLoan,
  returnLoan,
  updateLoan,
} from "../controllers/loanController";

const router = Router();

router.get("/", getLoans);
router.get("/:id", getLoan);
router.post("/", createLoan);
router.put("/:id/return", returnLoan);
router.put("/:id", updateLoan);

export default router;
