import dotenv from "dotenv";
import connectDB from "./config/database";
import app from "./app";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n🚀 LibraryOS API running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
    console.log(`\n📌 Endpoints:`);
    console.log(`   GET  /api/dashboard/stats`);
    console.log(`   GET  /api/books`);
    console.log(`   GET  /api/members`);
    console.log(`   GET  /api/loans`);
    console.log(`   GET  /api/reservations`);
    console.log(`   GET  /api/fines`);
    console.log(`\n🌱 To seed the DB: npm run seed\n`);
  });
};

startServer();

export default app;
