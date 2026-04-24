import mongoose, { Document, Schema } from "mongoose";

export interface IMember extends Document {
  name: string;
  email: string;
  phone: string;
  membershipType: "standard" | "premium" | "student";
  joinDate: Date;
  status: "active" | "suspended" | "expired";
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IMember>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    membershipType: {
      type: String,
      enum: ["standard", "premium", "student"],
      default: "standard",
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "suspended", "expired"],
      default: "active",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Note: email unique index is already created via `unique: true` in the schema field definition
MemberSchema.index({ name: "text", email: "text" });
MemberSchema.index({ status: 1 });

export const Member = mongoose.model<IMember>("Member", MemberSchema);
