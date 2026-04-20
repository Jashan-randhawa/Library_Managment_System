import { Response } from "express";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";

export async function listUsers(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
}

export async function createUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: "Name, email, and password are required" });
      return;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ success: false, message: "Email already in use" });
      return;
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "librarian",
      createdBy: req.user!._id,
    });

    res.status(201).json({
      success: true,
      data: { _id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive },
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to create user" });
  }
}

export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, role } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { ...(name && { name }), ...(role && { role }) },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update user" });
  }
}

export async function deactivateUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (id === String(req.user!._id)) {
      res.status(400).json({ success: false, message: "Cannot deactivate your own account" });
      return;
    }

    const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true }).select("-password");
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ success: false, message: "Failed to deactivate user" });
  }
}
