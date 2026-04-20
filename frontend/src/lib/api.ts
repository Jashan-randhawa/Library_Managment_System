// In production, VITE_API_URL points to the deployed backend (e.g. https://libraryos-api.vercel.app).
// In dev (or when the env var is absent), the Vite proxy forwards /api → localhost:5000.
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "API request failed");
  }
  return json.data;
}

export const booksApi = {
  getAll: (params?: { search?: string; genre?: string }) => {
    const q = new URLSearchParams(Object.fromEntries(Object.entries(params || {}).filter(([,v]) => v))).toString();
    return request<unknown[]>(`/books${q ? `?${q}` : ""}`);
  },
  getById: (id: string) => request<unknown>(`/books/${id}`),
  create: (data: unknown) => request<unknown>("/books", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: unknown) => request<unknown>(`/books/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request<unknown>(`/books/${id}`, { method: "DELETE" }),
};

export const membersApi = {
  getAll: (params?: { search?: string; status?: string; membershipType?: string }) => {
    const q = new URLSearchParams(Object.fromEntries(Object.entries(params || {}).filter(([,v]) => v))).toString();
    return request<unknown[]>(`/members${q ? `?${q}` : ""}`);
  },
  getById: (id: string) => request<unknown>(`/members/${id}`),
  create: (data: unknown) => request<unknown>("/members", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: unknown) => request<unknown>(`/members/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request<unknown>(`/members/${id}`, { method: "DELETE" }),
};

export const loansApi = {
  getAll: (params?: { search?: string; status?: string }) => {
    const q = new URLSearchParams(Object.fromEntries(Object.entries(params || {}).filter(([,v]) => v))).toString();
    return request<unknown[]>(`/loans${q ? `?${q}` : ""}`);
  },
  getById: (id: string) => request<unknown>(`/loans/${id}`),
  create: (data: { bookId: string; memberId: string; dueDays?: number }) =>
    request<unknown>("/loans", { method: "POST", body: JSON.stringify(data) }),
  returnBook: (id: string) => request<unknown>(`/loans/${id}/return`, { method: "PUT" }),
};

export const reservationsApi = {
  getAll: (params?: { search?: string; status?: string }) => {
    const q = new URLSearchParams(Object.fromEntries(Object.entries(params || {}).filter(([,v]) => v))).toString();
    return request<unknown[]>(`/reservations${q ? `?${q}` : ""}`);
  },
  create: (data: { bookId: string; memberId: string; expiryDays?: number }) =>
    request<unknown>("/reservations", { method: "POST", body: JSON.stringify(data) }),
  fulfill: (id: string) => request<unknown>(`/reservations/${id}/fulfill`, { method: "PUT" }),
  cancel: (id: string) => request<unknown>(`/reservations/${id}/cancel`, { method: "PUT" }),
};

export const finesApi = {
  getAll: (params?: { search?: string; status?: string }) => {
    const q = new URLSearchParams(Object.fromEntries(Object.entries(params || {}).filter(([,v]) => v))).toString();
    return request<unknown[]>(`/fines${q ? `?${q}` : ""}`);
  },
  create: (data: unknown) => request<unknown>("/fines", { method: "POST", body: JSON.stringify(data) }),
  pay: (id: string) => request<unknown>(`/fines/${id}/pay`, { method: "PUT" }),
  waive: (id: string) => request<unknown>(`/fines/${id}/waive`, { method: "PUT" }),
};

export const dashboardApi = {
  getStats: () => request<unknown>("/dashboard/stats"),
  getLoansByMonth: () => request<unknown[]>("/dashboard/loans-by-month"),
  getLoansByGenre: () => request<unknown[]>("/dashboard/loans-by-genre"),
  getRecentLoans: () => request<unknown[]>("/dashboard/recent-loans"),
  getLowStock: () => request<unknown[]>("/dashboard/low-stock"),
};
