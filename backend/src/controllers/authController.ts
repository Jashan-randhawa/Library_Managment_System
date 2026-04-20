import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";

const JWT_SECRET = process.env.JWT_SECRET || "libraryos-secret-key";
const JWT_EXPIRES = "7d";

function signToken(id: string): string {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: "Email and password are required" });
      return;
    }

    const user = await User.findOne({ email, isActive: true });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    const token = signToken(String(user._id));
    res.json({
      success: true,
      data: {
        token,
        user: { _id: user._id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Login failed" });
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    res.json({
      success: true,
      data: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to get user" });
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: null, message: "Logged out" });
}
