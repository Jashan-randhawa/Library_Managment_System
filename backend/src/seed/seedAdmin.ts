import dotenv from "dotenv";
import connectDB from "../config/database";
import User from "../models/User";

dotenv.config();

async function seedAdmin() {
  await connectDB();

  const existing = await User.findOne({ email: "admin@library.com" });
  if (existing) {
    console.log("✅ Admin user already exists — email: admin@library.com");
    process.exit(0);
  }

  await User.create({
    name: "Admin",
    email: "admin@library.com",
    password: "admin123",
    role: "admin",
    isActive: true,
  });

  console.log("✅ Default admin created:");
  console.log("   Email:    admin@library.com");
  console.log("   Password: admin123");
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
