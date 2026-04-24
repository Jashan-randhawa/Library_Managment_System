import { Router } from "express";
import { listUsers, createUser, updateUser, deactivateUser } from "../controllers/userController";
import { authenticate, authorizeAdmin } from "../middleware/auth";

const router = Router();

router.use(authenticate, authorizeAdmin);

router.get("/", listUsers);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deactivateUser);

export default router;
