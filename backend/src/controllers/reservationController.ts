import { Request, Response } from "express";
import { Reservation } from "../models/Reservation";
import { Book } from "../models/Book";
import { Member } from "../models/Member";

// Auto-expire old reservations
const markExpiredReservations = async (): Promise<void> => {
  await Reservation.updateMany(
    { status: "pending", expiryDate: { $lt: new Date() } },
    { $set: { status: "expired" } }
  );
};

// GET /api/reservations
export const getReservations = async (req: Request, res: Response): Promise<void> => {
  try {
    await markExpiredReservations();

    const { search, status, page = "1", limit = "50" } = req.query;
    const query: Record<string, unknown> = {};
    if (status && typeof status === "string") query.status = status;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [reservations, total] = await Promise.all([
      Reservation.find(query)
        .populate("bookId", "title author coverColor")
        .populate("memberId", "name email")
        .sort({ reservationDate: -1 })
        .skip(skip)
        .limit(limitNum),
      Reservation.countDocuments(query),
    ]);

    let data = reservations.map((r) => {
      const book = r.bookId as unknown as { title: string; author: string };
      const member = r.memberId as unknown as { name: string };
      return {
        ...r.toJSON(),
        bookTitle: book?.title || "",
        memberName: member?.name || "",
      };
    });

    if (search && typeof search === "string") {
      const s = search.toLowerCase();
      data = data.filter(
        (r) => r.bookTitle.toLowerCase().includes(s) || r.memberName.toLowerCase().includes(s)
      );
    }

    res.json({
      success: true,
      data,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch reservations", error });
  }
};

// GET /api/reservations/:id
export const getReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate("bookId", "title author isbn coverColor")
      .populate("memberId", "name email phone");
    if (!reservation) {
      res.status(404).json({ success: false, message: "Reservation not found" });
      return;
    }
    res.json({ success: true, data: reservation });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch reservation", error });
  }
};

// POST /api/reservations
export const createReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookId, memberId, expiryDays = 30 } = req.body;

    const book = await Book.findById(bookId);
    if (!book) {
      res.status(404).json({ success: false, message: "Book not found" });
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

    // Check if member already has a pending reservation for this book
    const existing = await Reservation.findOne({ bookId, memberId, status: "pending" });
    if (existing) {
      res.status(400).json({ success: false, message: "Member already has a pending reservation for this book" });
      return;
    }

    // Determine queue position
    const pendingCount = await Reservation.countDocuments({ bookId, status: "pending" });

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + Number(expiryDays));

    const reservation = await Reservation.create({
      bookId,
      memberId,
      expiryDate,
      status: "pending",
      queuePosition: pendingCount + 1,
    });

    const populated = await Reservation.findById(reservation._id)
      .populate("bookId", "title author")
      .populate("memberId", "name email");

    res.status(201).json({ success: true, data: populated, message: "Reservation created successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create reservation", error });
  }
};

// PUT /api/reservations/:id/fulfill
export const fulfillReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      res.status(404).json({ success: false, message: "Reservation not found" });
      return;
    }
    if (reservation.status !== "pending") {
      res.status(400).json({ success: false, message: `Reservation is already ${reservation.status}` });
      return;
    }

    const updated = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status: "fulfilled" },
      { new: true }
    ).populate("bookId", "title").populate("memberId", "name");

    // Reorder remaining queue positions for this book
    const remaining = await Reservation.find({ bookId: reservation.bookId, status: "pending" }).sort({ queuePosition: 1 });
    for (let i = 0; i < remaining.length; i++) {
      await Reservation.findByIdAndUpdate(remaining[i]._id, { queuePosition: i + 1 });
    }

    res.json({ success: true, data: updated, message: "Reservation fulfilled" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fulfill reservation", error });
  }
};

// PUT /api/reservations/:id/cancel
export const cancelReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      res.status(404).json({ success: false, message: "Reservation not found" });
      return;
    }
    if (reservation.status !== "pending") {
      res.status(400).json({ success: false, message: `Reservation is already ${reservation.status}` });
      return;
    }

    await Reservation.findByIdAndUpdate(req.params.id, { status: "cancelled" });

    // Reorder queue
    const remaining = await Reservation.find({ bookId: reservation.bookId, status: "pending" }).sort({ queuePosition: 1 });
    for (let i = 0; i < remaining.length; i++) {
      await Reservation.findByIdAndUpdate(remaining[i]._id, { queuePosition: i + 1 });
    }

    res.json({ success: true, message: "Reservation cancelled" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to cancel reservation", error });
  }
};
