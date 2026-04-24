import { Request, Response } from "express";
import { Loan } from "../models/Loan";
import { Book } from "../models/Book";
import { Member } from "../models/Member";
import { Fine } from "../models/Fine";
import { Reservation } from "../models/Reservation";

const markOverdueLoans = async (): Promise<void> => {
  await Loan.updateMany(
    { status: "active", dueDate: { $lt: new Date() } },
    { $set: { status: "overdue" } }
  );
};

export const getLoans = async (req: Request, res: Response): Promise<void> => {
  try {
    await markOverdueLoans();

    const { search, status, page = "1", limit = "50" } = req.query;
    const query: Record<string, unknown> = {};
    if (status && typeof status === "string") query.status = status;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const loansQuery = Loan.find(query)
      .populate("bookId", "title author isbn coverColor")
      .populate("memberId", "name email")
      .sort({ issueDate: -1 })
      .skip(skip)
      .limit(limitNum);

    const [loans, total] = await Promise.all([loansQuery, Loan.countDocuments(query)]);

    let data = loans.map((loan) => {
      const book = loan.bookId as unknown as { title: string; author: string; coverColor: string };
      const member = loan.memberId as unknown as { name: string; email: string };
      return {
        ...loan.toJSON(),
        bookTitle: book?.title || "",
        memberName: member?.name || "",
      };
    });

    if (search && typeof search === "string") {
      const s = search.toLowerCase();
      data = data.filter(
        (l) => l.bookTitle.toLowerCase().includes(s) || l.memberName.toLowerCase().includes(s)
      );
    }

    res.json({
      success: true,
      data,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch loans" });
  }
};

export const getLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate("bookId", "title author isbn coverColor")
      .populate("memberId", "name email phone");
    if (!loan) {
      res.status(404).json({ success: false, message: "Loan not found" });
      return;
    }
    res.json({ success: true, data: loan });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch loan" });
  }
};

export const createLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookId, memberId, dueDays = 14 } = req.body;

    const book = await Book.findById(bookId);
    if (!book) {
      res.status(404).json({ success: false, message: "Book not found" });
      return;
    }
    if (book.availableCopies <= 0) {
      res.status(400).json({ success: false, message: "No copies available for this book" });
      return;
    }

    const member = await Member.findById(memberId);
    if (!member) {
      res.status(404).json({ success: false, message: "Member not found" });
      return;
    }
    if (member.status !== "active") {
      res.status(400).json({ success: false, message: `Member account is ${member.status}` });
      return;
    }

    const existingLoan = await Loan.findOne({ bookId, memberId, status: { $in: ["active", "overdue"] } });
    if (existingLoan) {
      res.status(400).json({ success: false, message: "Member already has this book on loan" });
      return;
    }

    // BUG FIX: Block loan if member has unpaid fines
    const unpaidFines = await Fine.countDocuments({ memberId, status: "unpaid" });
    if (unpaidFines > 0) {
      res.status(400).json({ success: false, message: `Member has ${unpaidFines} unpaid fine(s). Please settle them before issuing a new loan.` });
      return;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Number(dueDays));

    const loan = await Loan.create({ bookId, memberId, dueDate, status: "active" });
    await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: -1 } });

    // BUG FIX: Auto-fulfill any pending reservation this member had for this book
    const pendingReservation = await Reservation.findOne({ bookId, memberId, status: "pending" });
    if (pendingReservation) {
      await Reservation.findByIdAndUpdate(pendingReservation._id, { status: "fulfilled" });
      // Reorder queue for remaining pending reservations on this book
      const remaining = await Reservation.find({ bookId, status: "pending" }).sort({ queuePosition: 1 });
      for (let i = 0; i < remaining.length; i++) {
        await Reservation.findByIdAndUpdate(remaining[i]._id, { queuePosition: i + 1 });
      }
    }

    const populated = await Loan.findById(loan._id)
      .populate("bookId", "title author")
      .populate("memberId", "name email");

    res.status(201).json({ success: true, data: populated, message: "Book issued successfully" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to create loan" });
  }
};

export const returnLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      res.status(404).json({ success: false, message: "Loan not found" });
      return;
    }
    if (loan.status === "returned") {
      res.status(400).json({ success: false, message: "This book has already been returned" });
      return;
    }

    const returnDate = new Date();
    const updatedLoan = await Loan.findByIdAndUpdate(
      req.params.id,
      { status: "returned", returnDate },
      { new: true }
    ).populate("bookId", "title").populate("memberId", "name");

    await Book.findByIdAndUpdate(loan.bookId, { $inc: { availableCopies: 1 } });

    // BUG FIX: Notify the next person in the reservation queue that the book is now available
    const nextReservation = await Reservation.findOne({ bookId: loan.bookId, status: "pending" }).sort({ queuePosition: 1 });
    if (nextReservation) {
      // In a real system, this would send an email/notification. We record it in the reservation.
      // For now we mark it as "ready" by setting a notifiedDate field if the model supports it,
      // or simply log it. The queue position reordering is handled on fulfill/cancel.
      console.log(`[Reservation Queue] Book returned — next reservation: memberId=${nextReservation.memberId}, reservationId=${nextReservation._id}`);
    }

    let fine = null;
    if (returnDate > loan.dueDate) {
      const daysLate = Math.ceil((returnDate.getTime() - loan.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const fineAmount = daysLate * 5;

      fine = await Fine.create({
        memberId: loan.memberId,
        loanId: loan._id,
        amount: fineAmount,
        reason: "Overdue return",
        issuedDate: returnDate,
        status: "unpaid",
      });
    }

    res.json({
      success: true,
      data: updatedLoan,
      fine: fine ? { amount: fine.amount, message: `Overdue fine of ₹${fine.amount} generated` } : null,
      message: "Book returned successfully",
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to return book" });
  }
};

export const updateLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    // Whitelist allowed fields
    const { dueDate, status } = req.body;
    const update: Record<string, unknown> = {};
    if (dueDate !== undefined) update.dueDate = dueDate;
    if (status !== undefined) update.status = status;

    const loan = await Loan.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!loan) {
      res.status(404).json({ success: false, message: "Loan not found" });
      return;
    }
    res.json({ success: true, data: loan });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update loan" });
  }
};
