import mongoose, { Document, Schema } from "mongoose";

export interface IBook extends Document {
  title: string;
  author: string;
  isbn: string;
  genre: string;
  publishedYear: number;
  totalCopies: number;
  availableCopies: number;
  coverColor: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookSchema = new Schema<IBook>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    author: {
      type: String,
      required: [true, "Author is required"],
      trim: true,
    },
    isbn: {
      type: String,
      required: [true, "ISBN is required"],
      unique: true,
      trim: true,
    },
    genre: {
      type: String,
      required: [true, "Genre is required"],
      enum: ["Fiction", "Fantasy", "Dystopian", "Historical", "Romance", "Adventure", "Science", "Biography", "Other"],
    },
    publishedYear: {
      type: Number,
      required: [true, "Published year is required"],
      min: 1000,
      max: new Date().getFullYear(),
    },
    totalCopies: {
      type: Number,
      required: true,
      min: [1, "Must have at least 1 copy"],
      default: 1,
    },
    availableCopies: {
      type: Number,
      required: true,
      min: [0, "Available copies cannot be negative"],
      default: 1,
    },
    coverColor: {
      type: String,
      default: "#6366f1",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for fast search
BookSchema.index({ title: "text", author: "text" });
BookSchema.index({ genre: 1 });
// Note: isbn unique index is already created via `unique: true` in the schema field definition

// Virtual: availability status
BookSchema.virtual("availabilityStatus").get(function () {
  if (this.availableCopies === 0) return "out_of_stock";
  if (this.availableCopies <= 1) return "low_stock";
  return "available";
});

// Custom validator: availableCopies <= totalCopies
BookSchema.path("availableCopies").validate(function (value: number) {
  return value <= this.totalCopies;
}, "Available copies cannot exceed total copies");

export const Book = mongoose.model<IBook>("Book", BookSchema);
