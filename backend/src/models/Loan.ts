import mongoose, { Document, Schema, Types } from "mongoose";

export interface ILoan extends Document {
  bookId: Types.ObjectId;
  memberId: Types.ObjectId;
  issueDate: Date;
  dueDate: Date;
  returnDate?: Date;
  status: "active" | "overdue" | "returned";
  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema = new Schema<ILoan>(
  {
    bookId: {
      type: Schema.Types.ObjectId,
      ref: "Book",
      required: [true, "Book is required"],
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: [true, "Member is required"],
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    returnDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "overdue", "returned"],
      default: "active",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

LoanSchema.index({ bookId: 1 });
LoanSchema.index({ memberId: 1 });
LoanSchema.index({ status: 1 });
LoanSchema.index({ dueDate: 1 });

// Auto-update overdue status
LoanSchema.pre("find", function () {
  // Note: actual overdue computation is done at the controller level via aggregation
});

export const Loan = mongoose.model<ILoan>("Loan", LoanSchema);
