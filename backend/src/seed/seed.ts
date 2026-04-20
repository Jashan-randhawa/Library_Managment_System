import mongoose from "mongoose";
import dotenv from "dotenv";
import { Book } from "../models/Book";
import { Member } from "../models/Member";
import { Loan } from "../models/Loan";
import { Reservation } from "../models/Reservation";
import { Fine } from "../models/Fine";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/libraryos";

const seedBooks = [
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "978-0743273565", genre: "Fiction", publishedYear: 1925, totalCopies: 5, availableCopies: 3, coverColor: "#6366f1" },
  { title: "To Kill a Mockingbird", author: "Harper Lee", isbn: "978-0061935466", genre: "Fiction", publishedYear: 1960, totalCopies: 4, availableCopies: 2, coverColor: "#10b981" },
  { title: "1984", author: "George Orwell", isbn: "978-0451524935", genre: "Dystopian", publishedYear: 1949, totalCopies: 6, availableCopies: 0, coverColor: "#f59e0b" },
  { title: "Pride and Prejudice", author: "Jane Austen", isbn: "978-0141439518", genre: "Romance", publishedYear: 1813, totalCopies: 3, availableCopies: 1, coverColor: "#ec4899" },
  { title: "The Catcher in the Rye", author: "J.D. Salinger", isbn: "978-0316769174", genre: "Fiction", publishedYear: 1951, totalCopies: 4, availableCopies: 4, coverColor: "#ef4444" },
  { title: "Brave New World", author: "Aldous Huxley", isbn: "978-0060850524", genre: "Dystopian", publishedYear: 1932, totalCopies: 3, availableCopies: 2, coverColor: "#8b5cf6" },
  { title: "The Hobbit", author: "J.R.R. Tolkien", isbn: "978-0547928227", genre: "Fantasy", publishedYear: 1937, totalCopies: 5, availableCopies: 3, coverColor: "#14b8a6" },
  { title: "Moby Dick", author: "Herman Melville", isbn: "978-0142437247", genre: "Adventure", publishedYear: 1851, totalCopies: 2, availableCopies: 2, coverColor: "#0ea5e9" },
  { title: "War and Peace", author: "Leo Tolstoy", isbn: "978-0140447934", genre: "Historical", publishedYear: 1869, totalCopies: 2, availableCopies: 1, coverColor: "#f97316" },
  { title: "Crime and Punishment", author: "Fyodor Dostoevsky", isbn: "978-0140449136", genre: "Fiction", publishedYear: 1866, totalCopies: 3, availableCopies: 2, coverColor: "#64748b" },
  { title: "The Alchemist", author: "Paulo Coelho", isbn: "978-0062315007", genre: "Fiction", publishedYear: 1988, totalCopies: 5, availableCopies: 3, coverColor: "#d97706" },
  { title: "Harry Potter and the Sorcerer's Stone", author: "J.K. Rowling", isbn: "978-0439708180", genre: "Fantasy", publishedYear: 1997, totalCopies: 8, availableCopies: 5, coverColor: "#7c3aed" },
];

const seedMembers = [
  { name: "Alice Johnson", email: "alice@email.com", phone: "+1-555-0101", membershipType: "premium", joinDate: new Date("2023-01-15"), status: "active" },
  { name: "Bob Williams", email: "bob@email.com", phone: "+1-555-0102", membershipType: "standard", joinDate: new Date("2023-03-22"), status: "active" },
  { name: "Carol Davis", email: "carol@email.com", phone: "+1-555-0103", membershipType: "student", joinDate: new Date("2023-06-10"), status: "active" },
  { name: "David Martinez", email: "david@email.com", phone: "+1-555-0104", membershipType: "standard", joinDate: new Date("2022-11-05"), status: "suspended" },
  { name: "Emma Wilson", email: "emma@email.com", phone: "+1-555-0105", membershipType: "premium", joinDate: new Date("2023-02-28"), status: "active" },
  { name: "Frank Brown", email: "frank@email.com", phone: "+1-555-0106", membershipType: "student", joinDate: new Date("2024-01-08"), status: "active" },
  { name: "Grace Lee", email: "grace@email.com", phone: "+1-555-0107", membershipType: "premium", joinDate: new Date("2022-09-14"), status: "active" },
  { name: "Henry Taylor", email: "henry@email.com", phone: "+1-555-0108", membershipType: "standard", joinDate: new Date("2023-08-19"), status: "expired" },
];

async function seed(): Promise<void> {
  try {
    console.log("🌱 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await Promise.all([
      Book.deleteMany({}),
      Member.deleteMany({}),
      Loan.deleteMany({}),
      Reservation.deleteMany({}),
      Fine.deleteMany({}),
    ]);

    // Insert books
    console.log("📚 Seeding books...");
    const books = await Book.insertMany(seedBooks);
    const bookMap = new Map(books.map((b, i) => [i, b._id]));

    // Insert members
    console.log("👥 Seeding members...");
    const members = await Member.insertMany(seedMembers);
    const memberMap = new Map(members.map((m, i) => [i, m._id]));

    // Insert loans
    console.log("📖 Seeding loans...");
    const loans = await Loan.insertMany([
      { bookId: bookMap.get(0), memberId: memberMap.get(0), issueDate: new Date("2024-03-01"), dueDate: new Date("2024-03-15"), returnDate: new Date("2024-03-14"), status: "returned" },
      { bookId: bookMap.get(2), memberId: memberMap.get(1), issueDate: new Date("2024-03-10"), dueDate: new Date("2024-03-24"), status: "overdue" },
      { bookId: bookMap.get(6), memberId: memberMap.get(2), issueDate: new Date("2024-03-15"), dueDate: new Date("2024-03-29"), status: "active" },
      { bookId: bookMap.get(1), memberId: memberMap.get(4), issueDate: new Date("2024-03-18"), dueDate: new Date("2024-04-01"), status: "active" },
      { bookId: bookMap.get(3), memberId: memberMap.get(6), issueDate: new Date("2024-03-05"), dueDate: new Date("2024-03-19"), status: "overdue" },
      { bookId: bookMap.get(10), memberId: memberMap.get(0), issueDate: new Date("2024-03-20"), dueDate: new Date("2024-04-03"), status: "active" },
      { bookId: bookMap.get(11), memberId: memberMap.get(5), issueDate: new Date("2024-03-22"), dueDate: new Date("2024-04-05"), status: "active" },
      { bookId: bookMap.get(4), memberId: memberMap.get(6), issueDate: new Date("2024-02-20"), dueDate: new Date("2024-03-05"), returnDate: new Date("2024-03-04"), status: "returned" },
    ]);

    // Insert reservations
    console.log("📅 Seeding reservations...");
    await Reservation.insertMany([
      { bookId: bookMap.get(2), memberId: memberMap.get(4), reservationDate: new Date("2024-03-20"), expiryDate: new Date("2024-04-20"), status: "pending", queuePosition: 1 },
      { bookId: bookMap.get(2), memberId: memberMap.get(5), reservationDate: new Date("2024-03-21"), expiryDate: new Date("2024-04-21"), status: "pending", queuePosition: 2 },
      { bookId: bookMap.get(3), memberId: memberMap.get(2), reservationDate: new Date("2024-03-18"), expiryDate: new Date("2024-04-18"), status: "pending", queuePosition: 1 },
      { bookId: bookMap.get(1), memberId: memberMap.get(0), reservationDate: new Date("2024-03-10"), expiryDate: new Date("2024-04-10"), status: "fulfilled", queuePosition: 1 },
      { bookId: bookMap.get(6), memberId: memberMap.get(1), reservationDate: new Date("2024-03-25"), expiryDate: new Date("2024-04-25"), status: "pending", queuePosition: 1 },
    ]);

    // Insert fines
    console.log("💰 Seeding fines...");
    await Fine.insertMany([
      { memberId: memberMap.get(1), loanId: loans[1]._id, amount: 5.50, reason: "Overdue return", issuedDate: new Date("2024-03-25"), status: "unpaid" },
      { memberId: memberMap.get(3), loanId: loans[2]._id, amount: 15.00, reason: "Overdue return", issuedDate: new Date("2024-02-15"), status: "unpaid" },
      { memberId: memberMap.get(3), loanId: loans[3]._id, amount: 10.00, reason: "Damaged book", issuedDate: new Date("2024-01-20"), status: "unpaid" },
      { memberId: memberMap.get(5), loanId: loans[4]._id, amount: 2.00, reason: "Overdue return", issuedDate: new Date("2024-03-20"), status: "unpaid" },
      { memberId: memberMap.get(6), loanId: loans[4]._id, amount: 8.00, reason: "Overdue return", issuedDate: new Date("2024-03-20"), paidDate: new Date("2024-03-22"), status: "paid" },
      { memberId: memberMap.get(0), loanId: loans[0]._id, amount: 3.50, reason: "Overdue return", issuedDate: new Date("2024-03-16"), paidDate: new Date("2024-03-18"), status: "paid" },
    ]);

    console.log("\n✅ Database seeded successfully!");
    console.log(`   📚 ${books.length} books`);
    console.log(`   👥 ${members.length} members`);
    console.log(`   📖 ${loans.length} loans`);
    console.log(`   📅 5 reservations`);
    console.log(`   💰 6 fines`);
  } catch (error) {
    console.error("❌ Seed failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

seed();
