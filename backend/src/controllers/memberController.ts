import { Request, Response } from "express";
import { Member } from "../models/Member";
import { Loan } from "../models/Loan";
import { Fine } from "../models/Fine";

export const getMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status, membershipType, page = "1", limit = "50" } = req.query;

    const query: Record<string, unknown> = {};

    if (search && typeof search === "string") {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }
    if (status && typeof status === "string") query.status = status;
    if (membershipType && typeof membershipType === "string") query.membershipType = membershipType;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [members, total] = await Promise.all([
      Member.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Member.countDocuments(query),
    ]);

    const memberIds = members.map((m) => m._id);

    const [loanCounts, fineAmounts] = await Promise.all([
      Loan.aggregate([
        { $match: { memberId: { $in: memberIds }, status: { $in: ["active", "overdue"] } } },
        { $group: { _id: "$memberId", count: { $sum: 1 } } },
      ]),
      Fine.aggregate([
        { $match: { memberId: { $in: memberIds }, status: "unpaid" } },
        { $group: { _id: "$memberId", total: { $sum: "$amount" } } },
      ]),
    ]);

    const loanMap = new Map(loanCounts.map((l) => [l._id.toString(), l.count]));
    const fineMap = new Map(fineAmounts.map((f) => [f._id.toString(), f.total]));

    const enriched = members.map((m) => ({
      ...m.toJSON(),
      loansCount: loanMap.get(m._id.toString()) ?? 0,
      finesOwed: fineMap.get(m._id.toString()) ?? 0,
    }));

    res.json({
      success: true,
      data: enriched,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch members" });
  }
};

export const getMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      res.status(404).json({ success: false, message: "Member not found" });
      return;
    }

    const [loans, fines] = await Promise.all([
      Loan.find({ memberId: member._id }).populate("bookId", "title author coverColor").sort({ issueDate: -1 }),
      Fine.find({ memberId: member._id }).populate("loanId").sort({ issuedDate: -1 }),
    ]);

    const finesOwed = fines.filter((f) => f.status === "unpaid").reduce((s, f) => s + f.amount, 0);

    res.json({
      success: true,
      data: {
        ...member.toJSON(),
        loansCount: loans.filter((l) => l.status !== "returned").length,
        finesOwed,
        loans,
        fines,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch member" });
  }
};

export const createMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, membershipType } = req.body;

    const existing = await Member.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(400).json({ success: false, message: "A member with this email already exists" });
      return;
    }

    const member = await Member.create({ name, email, phone, membershipType });
    res.status(201).json({ success: true, data: member, message: "Member added successfully" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to create member" });
  }
};

export const updateMember = async (req: Request, res: Response): Promise<void> => {
  try {
    // Whitelist allowed fields — never pass req.body directly
    const { name, phone, membershipType, status } = req.body;
    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (phone !== undefined) update.phone = phone;
    if (membershipType !== undefined) update.membershipType = membershipType;
    if (status !== undefined) update.status = status;

    const member = await Member.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!member) {
      res.status(404).json({ success: false, message: "Member not found" });
      return;
    }
    res.json({ success: true, data: member, message: "Member updated successfully" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update member" });
  }
};

export const deleteMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const activeLoans = await Loan.countDocuments({
      memberId: req.params.id,
      status: { $in: ["active", "overdue"] },
    });
    if (activeLoans > 0) {
      res.status(400).json({ success: false, message: "Cannot delete member with active loans" });
      return;
    }
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) {
      res.status(404).json({ success: false, message: "Member not found" });
      return;
    }
    res.json({ success: true, message: "Member deleted successfully" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to delete member" });
  }
};
