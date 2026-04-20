import { Router } from "express";
import {
  getReservations,
  getReservation,
  createReservation,
  fulfillReservation,
  cancelReservation,
} from "../controllers/reservationController";

const router = Router();

router.get("/", getReservations);
router.get("/:id", getReservation);
router.post("/", createReservation);
router.put("/:id/fulfill", fulfillReservation);
router.put("/:id/cancel", cancelReservation);

export default router;
