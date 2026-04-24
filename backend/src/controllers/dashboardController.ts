import { Request, Response } from "express";
import { Book } from "../models/Book";
import { Member } from "../models/Member";
import { Loan } from "../models/Loan";
import { Reservation } from "../models/Reservation";
import { Fine } from "../models/Fine";

// GET /api/dashboard/stats
export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Auto-mark overdue
    await Loan.updateMany(
      { status: "active", dueDate: { $lt: new Date() } },
      { $set: { status: "overdue" } }
    );

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalBooks,
      totalMembers,
      activeLoans,
      overdueLoans,
      pendingReservations,
      finesAgg,
      newMembersThisMonth,
    ] = await Promise.all([
      Book.countDocuments(),
      Member.countDocuments(),
      Loan.countDocuments({ status: "active" }),
      Loan.countDocuments({ status: "overdue" }),
      Reservation.countDocuments({ status: "pending" }),
      Fine.aggregate([
        { $match: { status: "unpaid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Member.countDocuments({ createdAt: { $gte: startOfMonth } }),
    ]);

    const totalFines = finesAgg[0]?.total ?? 0;

    res.json({
      success: true,
      data: {
        totalBooks,
        totalMembers,
        activeLoans,
        overdueLoans,
        pendingReservations,
        totalFines,
        newMembersThisMonth,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch dashboard stats", error });
  }
};

// GET /api/dashboard/loans-by-month  — last 6 months loan counts
export const getLoansByMonth = async (_req: Request, res: Response): Promise<void> => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const data = await Loan.aggregate([
      { $match: { issueDate: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$issueDate" },
            month: { $month: "$issueDate" },
          },
          loans: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const result = data.map((d) => ({
      month: months[d._id.month - 1],
      year: d._id.year,
      loans: d.loans,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch loans by month", error });
  }
};

// GET /api/dashboard/loans-by-genre
export const getLoansByGenre = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await Loan.aggregate([
      {
        $lookup: {
          from: "books",
          localField: "bookId",
          foreignField: "_id",
          as: "book",
        },
      },
      { $unwind: "$book" },
      {
        $group: {
          _id: "$book.genre",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({ success: true, data: data.map((d) => ({ genre: d._id, count: d.count })) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch loans by genre", error });
  }
};

// GET /api/dashboard/recent-loans
export const getRecentLoans = async (_req: Request, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find()
      .populate("bookId", "title author coverColor")
      .populate("memberId", "name")
      .sort({ issueDate: -1 })
      .limit(5);

    const data = loans.map((l) => {
      const book = l.bookId as unknown as { title: string; coverColor: string };
      const member = l.memberId as unknown as { name: string };
      return {
        ...l.toJSON(),
        bookTitle: book?.title || "",
        memberName: member?.name || "",
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch recent loans", error });
  }
};

// GET /api/dashboard/low-stock
export const getLowStockBooks = async (_req: Request, res: Response): Promise<void> => {
  try {
    const books = await Book.find({ availableCopies: { $lte: 1 } })
      .select("title availableCopies totalCopies")
      .sort({ availableCopies: 1 })
      .limit(5);
    res.json({ success: true, data: books });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch low stock books", error });
  }
};
