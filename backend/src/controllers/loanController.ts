import { Request, Response } from "express";
import { Loan } from "../models/Loan";
import { Book } from "../models/Book";
import { Member } from "../models/Member";
import { Fine } from "../models/Fine";

// Auto-mark overdue loans
const markOverdueLoans = async (): Promise<void> => {
  await Loan.updateMany(
    { status: "active", dueDate: { $lt: new Date() } },
    { $set: { status: "overdue" } }
  );
};

// GET /api/loans
export const getLoans = async (req: Request, res: Response): Promise<void> => {
  try {
    await markOverdueLoans();

    const { search, status, page = "1", limit = "50" } = req.query;
    const query: Record<string, unknown> = {};
    if (status && typeof status === "string") query.status = status;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    let loansQuery = Loan.find(query)
      .populate("bookId", "title author isbn coverColor")
      .populate("memberId", "name email")
      .sort({ issueDate: -1 })
      .skip(skip)
      .limit(limitNum);

    const [loans, total] = await Promise.all([loansQuery, Loan.countDocuments(query)]);

    // Apply search on populated fields
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
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch loans", error });
  }
};

// GET /api/loans/:id
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
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch loan", error });
  }
};

// POST /api/loans  — issue a book
export const createLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookId, memberId, dueDays = 14 } = req.body;

    // Validate book exists and is available
    const book = await Book.findById(bookId);
    if (!book) {
      res.status(404).json({ success: false, message: "Book not found" });
      return;
    }
    if (book.availableCopies <= 0) {
      res.status(400).json({ success: false, message: "No copies available for this book" });
      return;
    }

    // Validate member is active
    const member = await Member.findById(memberId);
    if (!member) {
      res.status(404).json({ success: false, message: "Member not found" });
      return;
    }
    if (member.status !== "active") {
      res.status(400).json({ success: false, message: `Member account is ${member.status}` });
      return;
    }

    // Check for existing active loan of same book by same member
    const existingLoan = await Loan.findOne({ bookId, memberId, status: { $in: ["active", "overdue"] } });
    if (existingLoan) {
      res.status(400).json({ success: false, message: "Member already has this book on loan" });
      return;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Number(dueDays));

    const loan = await Loan.create({ bookId, memberId, dueDate, status: "active" });

    // Decrement available copies
    await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: -1 } });

    const populated = await Loan.findById(loan._id)
      .populate("bookId", "title author")
      .populate("memberId", "name email");

    res.status(201).json({ success: true, data: populated, message: "Book issued successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create loan", error });
  }
};

// PUT /api/loans/:id/return  — return a book
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

    // Restore available copy
    await Book.findByIdAndUpdate(loan.bookId, { $inc: { availableCopies: 1 } });

    // Auto-generate overdue fine if late
    let fine = null;
    if (returnDate > loan.dueDate) {
      const daysLate = Math.ceil((returnDate.getTime() - loan.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const fineAmount = daysLate * 5; // ₹5/day

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
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to return book", error });
  }
};

// PUT /api/loans/:id  — general update
export const updateLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const loan = await Loan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!loan) {
      res.status(404).json({ success: false, message: "Loan not found" });
      return;
    }
    res.json({ success: true, data: loan });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update loan", error });
  }
};
