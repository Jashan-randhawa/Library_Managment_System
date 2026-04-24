import mongoose, { Document, Schema, Types } from "mongoose";

export interface IReservation extends Document {
  bookId: Types.ObjectId;
  memberId: Types.ObjectId;
  reservationDate: Date;
  expiryDate: Date;
  status: "pending" | "fulfilled" | "cancelled" | "expired";
  queuePosition: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema = new Schema<IReservation>(
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
    reservationDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
    },
    status: {
      type: String,
      enum: ["pending", "fulfilled", "cancelled", "expired"],
      default: "pending",
    },
    queuePosition: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ReservationSchema.index({ bookId: 1, status: 1 });
ReservationSchema.index({ memberId: 1 });
ReservationSchema.index({ status: 1 });

export const Reservation = mongoose.model<IReservation>("Reservation", ReservationSchema);
