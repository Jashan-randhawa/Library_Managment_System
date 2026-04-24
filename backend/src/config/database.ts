import mongoose from "mongoose";

// Cache connection across serverless function warm starts
let cached = (global as any).mongoose as {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

const connectDB = async (): Promise<void> => {
  // Return cached connection if available
  if (cached.conn) return;

  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/libraryos";

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, { bufferCommands: false })
      .then((m) => {
        console.log(`✅ MongoDB Connected: ${m.connection.host}`);
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }

  mongoose.connection.on("disconnected", () => {
    cached.conn = null;
    cached.promise = null;
    console.warn("⚠️  MongoDB disconnected");
  });

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB error:", err);
  });
};

export default connectDB;
