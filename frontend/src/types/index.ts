export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  publishedYear: number;
  totalCopies: number;
  availableCopies: number;
  coverColor?: string;
}

export interface Member {
  id: number;
  name: string;
  email: string;
  phone: string;
  membershipType: "standard" | "premium" | "student";
  joinDate: string;
  status: "active" | "suspended" | "expired";
  loansCount: number;
  finesOwed: number;
}

export interface Loan {
  id: number;
  bookId: number;
  bookTitle: string;
  memberId: number;
  memberName: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: "active" | "overdue" | "returned";
}

export interface Reservation {
  id: number;
  bookId: number;
  bookTitle: string;
  memberId: number;
  memberName: string;
  reservationDate: string;
  expiryDate: string;
  status: "pending" | "fulfilled" | "cancelled" | "expired";
  queuePosition: number;
}

export interface Fine {
  id: number;
  memberId: number;
  memberName: string;
  loanId: number;
  bookTitle: string;
  amount: number;
  reason: string;
  issuedDate: string;
  paidDate?: string;
  status: "unpaid" | "paid" | "waived";
}

export interface DashboardStats {
  totalBooks: number;
  totalMembers: number;
  activeLoans: number;
  overdueLoans: number;
  totalFines: number;
  newMembersThisMonth: number;
}
