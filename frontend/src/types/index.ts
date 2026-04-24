// ─── Domain types — keyed to MongoDB (_id: string) ───────────────────────────

export interface Book {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  publishedYear: number;
  totalCopies: number;
  availableCopies: number;
  coverColor?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type BookCreate = Omit<Book, "_id" | "availableCopies" | "createdAt" | "updatedAt">;
export type BookUpdate = Partial<Omit<Book, "_id" | "availableCopies" | "createdAt" | "updatedAt">>;

export interface Member {
  _id: string;
  name: string;
  email: string;
  phone: string;
  membershipType: "standard" | "premium" | "student";
  joinDate: string;
  status: "active" | "suspended" | "expired";
  loansCount: number;
  finesOwed: number;
  createdAt?: string;
  updatedAt?: string;
}

export type MemberCreate = Pick<Member, "name" | "email" | "phone" | "membershipType">;
export type MemberUpdate = Partial<Pick<Member, "name" | "phone" | "membershipType" | "status">>;

export interface Loan {
  _id: string;
  bookId: string;
  bookTitle: string;
  memberId: string;
  memberName: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: "active" | "overdue" | "returned";
}

export interface Reservation {
  _id: string;
  bookId: string;
  bookTitle: string;
  memberId: string;
  memberName: string;
  reservationDate: string;
  expiryDate: string;
  status: "pending" | "fulfilled" | "cancelled" | "expired";
  queuePosition: number;
}

export interface Fine {
  _id: string;
  memberId: string;
  memberName: string;
  loanId: string;
  bookTitle: string;
  amount: number;
  reason: string;
  issuedDate: string;
  paidDate?: string;
  status: "unpaid" | "paid" | "waived";
}

export interface StaffUser {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "librarian";
  isActive: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalBooks: number;
  totalMembers: number;
  activeLoans: number;
  overdueLoans: number;
  totalFines: number;
  newMembersThisMonth: number;
  pendingReservations: number;
}
