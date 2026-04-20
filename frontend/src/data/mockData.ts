import type { Book, Member, Loan, Reservation, Fine, DashboardStats } from "../types";

export const mockBooks: Book[] = [
  { id: 1, title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "978-0743273565", genre: "Fiction", publishedYear: 1925, totalCopies: 5, availableCopies: 3, coverColor: "#6366f1" },
  { id: 2, title: "To Kill a Mockingbird", author: "Harper Lee", isbn: "978-0061935466", genre: "Fiction", publishedYear: 1960, totalCopies: 4, availableCopies: 2, coverColor: "#10b981" },
  { id: 3, title: "1984", author: "George Orwell", isbn: "978-0451524935", genre: "Dystopian", publishedYear: 1949, totalCopies: 6, availableCopies: 0, coverColor: "#f59e0b" },
  { id: 4, title: "Pride and Prejudice", author: "Jane Austen", isbn: "978-0141439518", genre: "Romance", publishedYear: 1813, totalCopies: 3, availableCopies: 1, coverColor: "#ec4899" },
  { id: 5, title: "The Alchemist", author: "Paulo Coelho", isbn: "978-0062315007", genre: "Fiction", publishedYear: 1988, totalCopies: 5, availableCopies: 3, coverColor: "#d97706" },
  { id: 6, title: "Wings of Fire", author: "A.P.J. Abdul Kalam", isbn: "978-8173711466", genre: "Autobiography", publishedYear: 1999, totalCopies: 8, availableCopies: 5, coverColor: "#f97316" },
  { id: 7, title: "The Discovery of India", author: "Jawaharlal Nehru", isbn: "978-0195623598", genre: "Historical", publishedYear: 1946, totalCopies: 4, availableCopies: 2, coverColor: "#0ea5e9" },
  { id: 8, title: "Train to Pakistan", author: "Khushwant Singh", isbn: "978-0143031178", genre: "Historical Fiction", publishedYear: 1956, totalCopies: 3, availableCopies: 1, coverColor: "#14b8a6" },
  { id: 9, title: "The White Tiger", author: "Aravind Adiga", isbn: "978-1416562603", genre: "Fiction", publishedYear: 2008, totalCopies: 4, availableCopies: 3, coverColor: "#8b5cf6" },
  { id: 10, title: "A Suitable Boy", author: "Vikram Seth", isbn: "978-0060786526", genre: "Fiction", publishedYear: 1993, totalCopies: 3, availableCopies: 2, coverColor: "#ef4444" },
  { id: 11, title: "The God of Small Things", author: "Arundhati Roy", isbn: "978-0812979657", genre: "Fiction", publishedYear: 1997, totalCopies: 5, availableCopies: 4, coverColor: "#64748b" },
  { id: 12, title: "Harry Potter and the Sorcerer's Stone", author: "J.K. Rowling", isbn: "978-0439708180", genre: "Fantasy", publishedYear: 1997, totalCopies: 8, availableCopies: 5, coverColor: "#7c3aed" },
];

export const mockMembers: Member[] = [
  { id: 1, name: "Priya Sharma", email: "priya.sharma@gmail.com", phone: "+91-98765-43210", membershipType: "premium", joinDate: "2023-01-15", status: "active", loansCount: 3, finesOwed: 0 },
  { id: 2, name: "Rahul Verma", email: "rahul.verma@gmail.com", phone: "+91-87654-32109", membershipType: "standard", joinDate: "2023-03-22", status: "active", loansCount: 1, finesOwed: 50 },
  { id: 3, name: "Ananya Patel", email: "ananya.patel@gmail.com", phone: "+91-76543-21098", membershipType: "student", joinDate: "2023-06-10", status: "active", loansCount: 2, finesOwed: 0 },
  { id: 4, name: "Vikram Singh", email: "vikram.singh@gmail.com", phone: "+91-65432-10987", membershipType: "standard", joinDate: "2022-11-05", status: "suspended", loansCount: 0, finesOwed: 250 },
  { id: 5, name: "Neha Gupta", email: "neha.gupta@gmail.com", phone: "+91-54321-09876", membershipType: "premium", joinDate: "2023-02-28", status: "active", loansCount: 2, finesOwed: 0 },
  { id: 6, name: "Arjun Mehta", email: "arjun.mehta@gmail.com", phone: "+91-43210-98765", membershipType: "student", joinDate: "2024-01-08", status: "active", loansCount: 1, finesOwed: 20 },
  { id: 7, name: "Kavya Reddy", email: "kavya.reddy@gmail.com", phone: "+91-32109-87654", membershipType: "premium", joinDate: "2022-09-14", status: "active", loansCount: 4, finesOwed: 0 },
  { id: 8, name: "Amit Kumar", email: "amit.kumar@gmail.com", phone: "+91-21098-76543", membershipType: "standard", joinDate: "2023-08-19", status: "expired", loansCount: 0, finesOwed: 0 },
];

export const mockLoans: Loan[] = [
  { id: 1, bookId: 1, bookTitle: "The Great Gatsby", memberId: 1, memberName: "Priya Sharma", issueDate: "2024-03-01", dueDate: "2024-03-15", status: "returned", returnDate: "2024-03-14" },
  { id: 2, bookId: 3, bookTitle: "1984", memberId: 2, memberName: "Rahul Verma", issueDate: "2024-03-10", dueDate: "2024-03-24", status: "overdue" },
  { id: 3, bookId: 6, bookTitle: "Wings of Fire", memberId: 3, memberName: "Ananya Patel", issueDate: "2024-03-15", dueDate: "2024-03-29", status: "active" },
  { id: 4, bookId: 2, bookTitle: "To Kill a Mockingbird", memberId: 5, memberName: "Neha Gupta", issueDate: "2024-03-18", dueDate: "2024-04-01", status: "active" },
  { id: 5, bookId: 8, bookTitle: "Train to Pakistan", memberId: 7, memberName: "Kavya Reddy", issueDate: "2024-03-05", dueDate: "2024-03-19", status: "overdue" },
  { id: 6, bookId: 5, bookTitle: "The Alchemist", memberId: 1, memberName: "Priya Sharma", issueDate: "2024-03-20", dueDate: "2024-04-03", status: "active" },
  { id: 7, bookId: 12, bookTitle: "Harry Potter and the Sorcerer's Stone", memberId: 6, memberName: "Arjun Mehta", issueDate: "2024-03-22", dueDate: "2024-04-05", status: "active" },
  { id: 8, bookId: 4, bookTitle: "Pride and Prejudice", memberId: 7, memberName: "Kavya Reddy", issueDate: "2024-02-20", dueDate: "2024-03-05", status: "returned", returnDate: "2024-03-04" },
];

export const mockReservations: Reservation[] = [
  { id: 1, bookId: 3, bookTitle: "1984", memberId: 5, memberName: "Neha Gupta", reservationDate: "2024-03-20", expiryDate: "2024-04-20", status: "pending", queuePosition: 1 },
  { id: 2, bookId: 3, bookTitle: "1984", memberId: 6, memberName: "Arjun Mehta", reservationDate: "2024-03-21", expiryDate: "2024-04-21", status: "pending", queuePosition: 2 },
  { id: 3, bookId: 8, bookTitle: "Train to Pakistan", memberId: 3, memberName: "Ananya Patel", reservationDate: "2024-03-18", expiryDate: "2024-04-18", status: "pending", queuePosition: 1 },
  { id: 4, bookId: 2, bookTitle: "To Kill a Mockingbird", memberId: 1, memberName: "Priya Sharma", reservationDate: "2024-03-10", expiryDate: "2024-04-10", status: "fulfilled", queuePosition: 1 },
  { id: 5, bookId: 6, bookTitle: "Wings of Fire", memberId: 2, memberName: "Rahul Verma", reservationDate: "2024-03-25", expiryDate: "2024-04-25", status: "pending", queuePosition: 1 },
];

export const mockFines: Fine[] = [
  { id: 1, memberId: 2, memberName: "Rahul Verma", loanId: 2, bookTitle: "1984", amount: 50, reason: "Overdue return", issuedDate: "2024-03-25", status: "unpaid" },
  { id: 2, memberId: 4, memberName: "Vikram Singh", loanId: 3, bookTitle: "Wings of Fire", amount: 150, reason: "Overdue return", issuedDate: "2024-02-15", status: "unpaid" },
  { id: 3, memberId: 4, memberName: "Vikram Singh", loanId: 4, bookTitle: "The Discovery of India", amount: 100, reason: "Damaged book", issuedDate: "2024-01-20", status: "unpaid" },
  { id: 4, memberId: 6, memberName: "Arjun Mehta", loanId: 5, bookTitle: "Train to Pakistan", amount: 20, reason: "Overdue return", issuedDate: "2024-03-20", status: "unpaid" },
  { id: 5, memberId: 7, memberName: "Kavya Reddy", loanId: 5, bookTitle: "Train to Pakistan", amount: 80, reason: "Overdue return", issuedDate: "2024-03-20", paidDate: "2024-03-22", status: "paid" },
  { id: 6, memberId: 1, memberName: "Priya Sharma", loanId: 1, bookTitle: "The Great Gatsby", amount: 35, reason: "Overdue return", issuedDate: "2024-03-16", paidDate: "2024-03-18", status: "paid" },
];

export const mockDashboardStats: DashboardStats = {
  totalBooks: mockBooks.length,
  totalMembers: mockMembers.length,
  activeLoans: mockLoans.filter(l => l.status === "active").length,
  overdueLoans: mockLoans.filter(l => l.status === "overdue").length,
  totalFines: mockFines.filter(f => f.status === "unpaid").reduce((sum, f) => sum + f.amount, 0),
  newMembersThisMonth: 3,
};
