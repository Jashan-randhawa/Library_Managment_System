import type {
  Book, BookCreate, BookUpdate,
  Member, MemberCreate, MemberUpdate,
  Loan, Reservation, Fine, StaffUser, DashboardStats,
} from "../types";

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

const TOKEN_KEY = "libraryos_token";

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// ─── Global 401 handler ───────────────────────────────────────────────────────
// When any request returns 401, clear the token so AuthContext re-routes to /login
function handle401() {
  localStorage.removeItem(TOKEN_KEY);
  // Let the page reload so AuthContext notices the missing token
  window.location.href = "/login";
}

// ─── Core request helper ──────────────────────────────────────────────────────
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  // Handle token expiry / unauthenticated globally
  if (res.status === 401) {
    handle401();
    throw new Error("Session expired. Please log in again.");
  }

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "API request failed");
  }
  return json.data as T;
}

// BUG FIX: returnBook needs to surface fine info from the response.
// This special variant returns the full response body, not just json.data.
async function requestFull<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  if (res.status === 401) {
    handle401();
    throw new Error("Session expired. Please log in again.");
  }

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "API request failed");
  }
  return json as T;
}

// ─── Query-string builder ─────────────────────────────────────────────────────
function qs(params?: Record<string, string | undefined>): string {
  if (!params) return "";
  const filtered = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (!filtered.length) return "";
  return "?" + new URLSearchParams(filtered as [string, string][]).toString();
}

// ─── Books ────────────────────────────────────────────────────────────────────
export const booksApi = {
  getAll: (params?: { search?: string; genre?: string }) =>
    request<Book[]>(`/books${qs(params)}`),

  getById: (id: string) =>
    request<Book>(`/books/${id}`),

  create: (data: BookCreate) =>
    request<Book>("/books", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: BookUpdate) =>
    request<Book>(`/books/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<void>(`/books/${id}`, { method: "DELETE" }),
};

// ─── Members ──────────────────────────────────────────────────────────────────
export const membersApi = {
  getAll: (params?: { search?: string; status?: string; membershipType?: string }) =>
    request<Member[]>(`/members${qs(params)}`),

  getById: (id: string) =>
    request<Member>(`/members/${id}`),

  create: (data: MemberCreate) =>
    request<Member>("/members", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: MemberUpdate) =>
    request<Member>(`/members/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<void>(`/members/${id}`, { method: "DELETE" }),
};

// ─── Loans ────────────────────────────────────────────────────────────────────
export const loansApi = {
  getAll: (params?: { search?: string; status?: string }) =>
    request<Loan[]>(`/loans${qs(params)}`),

  getById: (id: string) =>
    request<Loan>(`/loans/${id}`),

  create: (data: { bookId: string; memberId: string; dueDays?: number }) =>
    request<Loan>("/loans", { method: "POST", body: JSON.stringify(data) }),

  // BUG FIX: Use requestFull so the fine property isn't silently dropped
  returnBook: (id: string) =>
    requestFull<{ data: Loan; fine: { amount: number; message: string } | null }>(`/loans/${id}/return`, { method: "PUT" }),
};

// ─── Reservations ─────────────────────────────────────────────────────────────
export const reservationsApi = {
  getAll: (params?: { search?: string; status?: string }) =>
    request<Reservation[]>(`/reservations${qs(params)}`),

  create: (data: { bookId: string; memberId: string; expiryDays?: number }) =>
    request<Reservation>("/reservations", { method: "POST", body: JSON.stringify(data) }),

  fulfill: (id: string) =>
    request<Reservation>(`/reservations/${id}/fulfill`, { method: "PUT" }),

  cancel: (id: string) =>
    request<Reservation>(`/reservations/${id}/cancel`, { method: "PUT" }),
};

// ─── Fines ────────────────────────────────────────────────────────────────────
export const finesApi = {
  getAll: (params?: { search?: string; status?: string }) =>
    request<Fine[]>(`/fines${qs(params)}`),

  // BUG FIX: memberId is required by the backend createFine endpoint
  create: (data: { memberId: string; loanId: string; amount: number; reason?: string }) =>
    request<Fine>("/fines", { method: "POST", body: JSON.stringify(data) }),

  pay: (id: string) =>
    request<Fine>(`/fines/${id}/pay`, { method: "PUT" }),

  waive: (id: string) =>
    request<Fine>(`/fines/${id}/waive`, { method: "PUT" }),
};

// ─── Staff Users (admin only) ─────────────────────────────────────────────────
export const usersApi = {
  getAll: () =>
    request<StaffUser[]>("/users"),

  create: (data: { name: string; email: string; password: string; role: "admin" | "librarian" }) =>
    request<StaffUser>("/users", { method: "POST", body: JSON.stringify(data) }),

  toggleActive: (id: string) =>
    request<StaffUser>(`/users/${id}/toggle-active`, { method: "PUT" }),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  getStats: () =>
    request<DashboardStats>("/dashboard/stats"),

  getLoansByMonth: () =>
    request<{ month: string; loans: number }[]>("/dashboard/loans-by-month"),

  getLoansByGenre: () =>
    request<{ genre: string; count: number }[]>("/dashboard/loans-by-genre"),

  getRecentLoans: () =>
    request<Loan[]>("/dashboard/recent-loans"),

  getLowStock: () =>
    request<Pick<Book, "_id" | "title" | "availableCopies">[]>("/dashboard/low-stock"),
};
