import mongoose, { Document, Schema, Types } from "mongoose";

export interface IFine extends Document {
  memberId: Types.ObjectId;
  loanId: Types.ObjectId;
  amount: number;
  reason: string;
  issuedDate: Date;
  paidDate?: Date;
  status: "unpaid" | "paid" | "waived";
  createdAt: Date;
  updatedAt: Date;
}

const FineSchema = new Schema<IFine>(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: [true, "Member is required"],
    },
    loanId: {
      type: Schema.Types.ObjectId,
      ref: "Loan",
      required: [true, "Loan is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    reason: {
      type: String,
      required: [true, "Reason is required"],
      enum: ["Overdue return", "Damaged book", "Lost book", "Other"],
      default: "Overdue return",
    },
    issuedDate: {
      type: Date,
      default: Date.now,
    },
    paidDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["unpaid", "paid", "waived"],
      default: "unpaid",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

FineSchema.index({ memberId: 1 });
FineSchema.index({ loanId: 1 });
FineSchema.index({ status: 1 });

export const Fine = mongoose.model<IFine>("Fine", FineSchema);
