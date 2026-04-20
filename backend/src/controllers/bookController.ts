import { Request, Response } from "express";
import { Book } from "../models/Book";

// GET /api/books
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

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
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
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch books", error });
  }
};

// GET /api/books/:id
export const getBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      res.status(404).json({ success: false, message: "Book not found" });
      return;
    }
    res.json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch book", error });
  }
};

// POST /api/books
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
      res.status(500).json({ success: false, message: "Failed to create book", error });
    }
  }
};

// PUT /api/books/:id
export const updateBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      res.status(404).json({ success: false, message: "Book not found" });
      return;
    }

    const { totalCopies, availableCopies } = req.body;

    // If totalCopies is being reduced, validate it doesn't go below checked-out copies
    if (totalCopies !== undefined && availableCopies === undefined) {
      const checkedOut = book.totalCopies - book.availableCopies;
      if (totalCopies < checkedOut) {
        res.status(400).json({
          success: false,
          message: `Cannot set total copies to ${totalCopies}; ${checkedOut} copies are currently on loan`,
        });
        return;
      }
      req.body.availableCopies = totalCopies - checkedOut;
    }

    const updated = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: updated, message: "Book updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update book", error });
  }
};

// DELETE /api/books/:id
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
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete book", error });
  }
};
