import { Request, Response } from "express";
import { Book } from "../models/Book";

export const getBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, genre, page = "1", limit = "50" } = req.query;

    const query: Record<string, unknown> = {};

    if (search && typeof search === "string") {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { isbn: { $regex: search, $options: "i" } },
      ];
    }

    if (genre && typeof genre === "string") {
      query.genre = genre;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [books, total] = await Promise.all([
      Book.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Book.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: books,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch books" });
  }
};

export const getBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      res.status(404).json({ success: false, message: "Book not found" });
      return;
    }
    res.json({ success: true, data: book });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch book" });
  }
};

export const createBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, author, isbn, genre, publishedYear, totalCopies, coverColor } = req.body;

    const existing = await Book.findOne({ isbn });
    if (existing) {
      res.status(400).json({ success: false, message: "A book with this ISBN already exists" });
      return;
    }

    const book = await Book.create({
      title,
      author,
      isbn,
      genre,
      publishedYear,
      totalCopies: totalCopies ?? 1,
      availableCopies: totalCopies ?? 1,
      coverColor: coverColor || "#6366f1",
    });

    res.status(201).json({ success: true, data: book, message: "Book added successfully" });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("duplicate key")) {
      res.status(400).json({ success: false, message: "ISBN already exists" });
    } else {
      res.status(500).json({ success: false, message: "Failed to create book" });
    }
  }
};

export const updateBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      res.status(404).json({ success: false, message: "Book not found" });
      return;
    }

    // Whitelist allowed fields — never pass req.body directly
    const { title, author, genre, publishedYear, totalCopies, coverColor } = req.body;
    const update: Record<string, unknown> = {};
    if (title !== undefined) update.title = title;
    if (author !== undefined) update.author = author;
    if (genre !== undefined) update.genre = genre;
    if (publishedYear !== undefined) update.publishedYear = publishedYear;
    if (coverColor !== undefined) update.coverColor = coverColor;

    if (totalCopies !== undefined) {
      const checkedOut = book.totalCopies - book.availableCopies;
      if (totalCopies < checkedOut) {
        res.status(400).json({
          success: false,
          message: `Cannot set total copies to ${totalCopies}; ${checkedOut} copies are currently on loan`,
        });
        return;
      }
      update.totalCopies = totalCopies;
      update.availableCopies = totalCopies - checkedOut;
    }

    const updated = await Book.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: updated, message: "Book updated successfully" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update book" });
  }
};

export const deleteBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      res.status(404).json({ success: false, message: "Book not found" });
      return;
    }

    const checkedOut = book.totalCopies - book.availableCopies;
    if (checkedOut > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete book; ${checkedOut} copies are currently on loan`,
      });
      return;
    }

    await Book.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Book deleted successfully" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to delete book" });
  }
};
