import { Request, Response } from "express";
import { Fine } from "../models/Fine";
import { Member } from "../models/Member";
import { Loan } from "../models/Loan";

export const getFines = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status, page = "1", limit = "50" } = req.query;
    const query: Record<string, unknown> = {};
    if (status && typeof status === "string") query.status = status;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [fines, total] = await Promise.all([
      Fine.find(query)
        .populate("memberId", "name email")
        .populate({ path: "loanId", populate: { path: "bookId", select: "title" } })
        .sort({ issuedDate: -1 })
        .skip(skip)
        .limit(limitNum),
      Fine.countDocuments(query),
    ]);

    let data = fines.map((f) => {
      const member = f.memberId as unknown as { name: string };
      const loan = f.loanId as unknown as { bookId: { title: string } };
      return {
        ...f.toJSON(),
        memberName: member?.name || "",
        bookTitle: loan?.bookId?.title || "",
      };
    });

    if (search && typeof search === "string") {
      const s = search.toLowerCase();
      data = data.filter(
        (f) => f.memberName.toLowerCase().includes(s) || f.bookTitle.toLowerCase().includes(s)
      );
    }

    res.json({
      success: true,
      data,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch fines" });
  }
};

export const getFine = async (req: Request, res: Response): Promise<void> => {
  try {
    const fine = await Fine.findById(req.params.id)
      .populate("memberId", "name email phone")
      .populate({ path: "loanId", populate: { path: "bookId", select: "title author" } });
    if (!fine) {
      res.status(404).json({ success: false, message: "Fine not found" });
      return;
    }
    res.json({ success: true, data: fine });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch fine" });
  }
};

export const createFine = async (req: Request, res: Response): Promise<void> => {
  try {
    const { memberId, loanId, amount, reason } = req.body;

    const [member, loan] = await Promise.all([
      Member.findById(memberId),
      Loan.findById(loanId),
    ]);

    if (!member) {
      res.status(404).json({ success: false, message: "Member not found" });
      return;
    }
    if (!loan) {
      res.status(404).json({ success: false, message: "Loan not found" });
      return;
    }

    const fine = await Fine.create({ memberId, loanId, amount, reason, status: "unpaid" });
    const populated = await Fine.findById(fine._id)
      .populate("memberId", "name email")
      .populate({ path: "loanId", populate: { path: "bookId", select: "title" } });

    res.status(201).json({ success: true, data: populated, message: "Fine created successfully" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to create fine" });
  }
};

export const payFine = async (req: Request, res: Response): Promise<void> => {
  try {
    const fine = await Fine.findById(req.params.id);
    if (!fine) {
      res.status(404).json({ success: false, message: "Fine not found" });
      return;
    }
    if (fine.status !== "unpaid") {
      res.status(400).json({ success: false, message: `Fine is already ${fine.status}` });
      return;
    }

    const updated = await Fine.findByIdAndUpdate(
      req.params.id,
      { status: "paid", paidDate: new Date() },
      { new: true }
    ).populate("memberId", "name").populate({ path: "loanId", populate: { path: "bookId", select: "title" } });

    res.json({ success: true, data: updated, message: "Fine marked as paid" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to pay fine" });
  }
};

export const waiveFine = async (req: Request, res: Response): Promise<void> => {
  try {
    const fine = await Fine.findById(req.params.id);
    if (!fine) {
      res.status(404).json({ success: false, message: "Fine not found" });
      return;
    }
    if (fine.status !== "unpaid") {
      res.status(400).json({ success: false, message: `Fine is already ${fine.status}` });
      return;
    }

    const updated = await Fine.findByIdAndUpdate(
      req.params.id,
      { status: "waived" },
      { new: true }
    ).populate("memberId", "name");

    res.json({ success: true, data: updated, message: "Fine waived" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to waive fine" });
  }
};

export const getFinesSummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    const summary = await Fine.aggregate([
      { $group: { _id: "$status", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);
    res.json({ success: true, data: summary });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch fines summary" });
  }
};
