import { useState, useEffect, useCallback, useRef } from "react";
import {
  CalendarCheck, CheckCircle, XCircle, Clock, Calendar, Plus,
  BookOpen, ArrowRight, ArrowLeft, Search, X, User, Hash, RefreshCw,
} from "lucide-react";
import {
  PageHeader, Card, Badge, Select, Table, Th, Td, TableFooter,
  Button, Empty, SkeletonRows, SearchBar, Alert,
} from "../components/ui";
import { reservationsApi, booksApi, membersApi } from "../lib/api";
import type { Book, Member } from "../types";
import { formatDate, useDebounce, cn } from "../lib/utils";
import { useToast } from "../components/Toast";

interface Reservation {
  _id: string;
  bookTitle: string;
  memberName: string;
  reservationDate: string;
  expiryDate: string;
  status: string;
  queuePosition: number;
}

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
];

const statusBadge: Record<string, "warning" | "success" | "danger" | "neutral"> = {
  pending: "warning", fulfilled: "success", cancelled: "danger", expired: "neutral",
};

// ── Shared palette helpers (mirrored from Loans) ──────────────────────────────
const COVER_PALETTES = [
  { from: "#f59e0b", to: "#d97706" },
  { from: "#6366f1", to: "#4f46e5" },
  { from: "#10b981", to: "#059669" },
  { from: "#ef4444", to: "#dc2626" },
  { from: "#8b5cf6", to: "#7c3aed" },
  { from: "#f97316", to: "#ea580c" },
  { from: "#06b6d4", to: "#0891b2" },
  { from: "#ec4899", to: "#db2777" },
];
function coverPalette(title: string) {
  const idx = title.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % COVER_PALETTES.length;
  return COVER_PALETTES[idx];
}

const AVATAR_COLORS = [
  "from-indigo-400 to-indigo-600",
  "from-emerald-400 to-emerald-600",
  "from-amber-400 to-amber-600",
  "from-rose-400 to-rose-600",
  "from-violet-400 to-violet-600",
  "from-sky-400 to-sky-600",
];
function avatarGradient(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

const EXPIRY_PRESETS = [
  { label: "7d",  sublabel: "1 week",   days: "7"  },
  { label: "14d", sublabel: "2 weeks",  days: "14" },
  { label: "30d", sublabel: "1 month",  days: "30" },
  { label: "60d", sublabel: "2 months", days: "60" },
];

// ── Step Indicator ────────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Book"    },
    { n: 2, label: "Member"  },
    { n: 3, label: "Confirm" },
  ];
  return (
    <div className="flex items-center justify-center gap-0 select-none">
      {steps.map((s, i) => {
        const done   = step > s.n;
        const active = step === s.n;
        return (
          <div key={s.n} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                done   ? "bg-indigo-500 text-white shadow-sm shadow-indigo-200"
                       : active
                         ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 ring-2 ring-indigo-400"
                         : "bg-[var(--color-background-secondary)] text-theme-muted"
              )}>
                {done ? <CheckCircle className="w-4 h-4" /> : s.n}
              </div>
              <span className={cn("text-[10px] font-bold tracking-wide",
                active ? "text-indigo-600 dark:text-indigo-400" : done ? "text-indigo-500" : "text-theme-muted"
              )}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                "w-12 sm:w-16 h-px mx-1 mb-4 transition-all duration-300",
                done ? "bg-indigo-400" : "bg-[var(--color-border-secondary)]"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Book Cover Card ───────────────────────────────────────────────────────────
function BookCoverCard({ book, selected, onClick }: { book: Book; selected: boolean; onClick: () => void }) {
  const pal = coverPalette(book.title);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative rounded-2xl overflow-hidden text-left transition-all duration-200 focus:outline-none",
        selected
          ? "ring-2 ring-indigo-500 ring-offset-2 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/30 scale-[1.01]"
          : "hover:scale-[1.02] hover:shadow-md"
      )}
    >
      {/* Cover */}
      <div
        className="h-28 flex flex-col items-center justify-center relative overflow-hidden"
        style={{ background: `linear-gradient(145deg, ${pal.from}, ${pal.to})` }}
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-2 left-2 right-2 h-px bg-white/60" />
          <div className="absolute bottom-2 left-2 right-2 h-px bg-white/60" />
          <div className="absolute top-2 bottom-2 left-2 w-px bg-white/60" />
          <div className="absolute top-2 bottom-2 right-2 w-px bg-white/60" />
        </div>
        <BookOpen className="w-7 h-7 text-white/90 mb-1" />
        {selected && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/90 flex items-center justify-center">
            <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
          </div>
        )}
        {book.availableCopies === 0 && (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
            <span className="text-[10px] font-bold text-white">Unavailable</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 bg-[var(--color-background-primary)] border border-t-0 border-[var(--color-border-tertiary)] rounded-b-2xl">
        <p className="text-xs font-bold text-theme-primary leading-tight line-clamp-2 mb-1">{book.title}</p>
        <p className="text-[10px] text-theme-muted truncate mb-1.5">{book.author}</p>
        <div className="flex items-center gap-1">
          <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0",
            book.availableCopies === 0 ? "bg-red-500" : book.availableCopies < 3 ? "bg-amber-500" : "bg-emerald-500"
          )} />
          <span className="text-[10px] font-semibold text-theme-secondary">
            {book.availableCopies}/{book.totalCopies}
          </span>
        </div>
      </div>
    </button>
  );
}

// ── Member Row Card ───────────────────────────────────────────────────────────
function MemberRowCard({ member, selected, onClick }: { member: Member; selected: boolean; onClick: () => void }) {
  const inactive = member.status !== "active";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={inactive}
      className={cn(
        "w-full text-left rounded-2xl border p-3 flex items-center gap-3 transition-all duration-200 focus:outline-none",
        selected
          ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm shadow-indigo-100"
          : "border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)] hover:border-[var(--color-border-secondary)] hover:bg-[var(--color-background-secondary)]",
        inactive && "opacity-40 cursor-not-allowed"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm font-bold bg-gradient-to-br shadow-sm",
        avatarGradient(member.name)
      )}>
        {member.name[0]?.toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-bold truncate", selected ? "text-indigo-700 dark:text-indigo-300" : "text-theme-primary")}>
          {member.name}
        </p>
        <p className="text-[11px] text-theme-muted truncate">{member.email}</p>
        {member.finesOwed > 0 && (
          <span className="text-[10px] font-bold text-amber-600">₹{member.finesOwed} outstanding</span>
        )}
      </div>

      {inactive && <span className="text-[10px] font-bold text-red-500 capitalize flex-shrink-0">{member.status}</span>}
      {selected && <CheckCircle className="w-4 h-4 text-indigo-500 flex-shrink-0" />}
    </button>
  );
}

// ── Reservation Ticket (step 3) ───────────────────────────────────────────────
function ReservationTicket({ book, member, expiryDays }: { book: Book; member: Member; expiryDays: string }) {
  const pal      = coverPalette(book.title);
  const expiry   = new Date();
  expiry.setDate(expiry.getDate() + Number(expiryDays));

  return (
    <div className="rounded-2xl overflow-hidden border border-[var(--color-border-secondary)] shadow-md">
      {/* Header band */}
      <div
        className="px-5 py-3.5 flex items-center gap-3"
        style={{ background: `linear-gradient(135deg, ${pal.from}, ${pal.to})` }}
      >
        <div className="w-10 h-14 rounded-md bg-white/20 flex items-center justify-center shadow-inner flex-shrink-0">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm leading-tight line-clamp-2">{book.title}</p>
          <p className="text-white/70 text-[11px] mt-0.5">{book.author}</p>
        </div>
      </div>

      {/* Perforations */}
      <div className="flex items-center">
        <div className="w-4 h-4 rounded-full -ml-2 bg-[var(--color-background-primary)] border border-[var(--color-border-secondary)] flex-shrink-0" />
        <div className="flex-1 border-t-2 border-dashed border-[var(--color-border-secondary)]" />
        <div className="w-4 h-4 rounded-full -mr-2 bg-[var(--color-background-primary)] border border-[var(--color-border-secondary)] flex-shrink-0" />
      </div>

      {/* Body */}
      <div className="bg-[var(--color-background-primary)] px-5 py-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest mb-1 flex items-center gap-1">
            <User className="w-3 h-3" /> Member
          </p>
          <p className="text-sm font-bold text-theme-primary">{member.name}</p>
          <p className="text-[11px] text-theme-muted">{member.email}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Expires On
          </p>
          <p className="text-sm font-bold text-theme-primary">{formatDate(expiry.toISOString())}</p>
          <p className="text-[11px] text-theme-muted">{expiryDays} day hold</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest mb-1 flex items-center gap-1">
            <Hash className="w-3 h-3" /> Availability
          </p>
          <p className={cn("text-sm font-bold", book.availableCopies === 0 ? "text-red-500" : "text-emerald-600")}>
            {book.availableCopies === 0 ? "Unavailable" : `${book.availableCopies} available`}
          </p>
          <p className="text-[11px] text-theme-muted">{book.totalCopies} total copies</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest mb-1 flex items-center gap-1">
            <CalendarCheck className="w-3 h-3" /> Reserved On
          </p>
          <p className="text-sm font-bold text-theme-primary">{formatDate(new Date().toISOString())}</p>
          <p className="text-[11px] text-theme-muted">today</p>
        </div>
      </div>

      {book.availableCopies > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 px-5 py-2.5 border-t border-amber-200 dark:border-amber-800">
          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
            ⚠ This book is currently available — consider issuing it instead
          </p>
        </div>
      )}
    </div>
  );
}

// ── Reserve Overlay ───────────────────────────────────────────────────────────
function ReserveOverlay({
  open, onClose, onSuccess,
}: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const { toast } = useToast();
  const [step,           setStep]           = useState<1 | 2 | 3>(1);
  const [books,          setBooks]          = useState<Book[]>([]);
  const [members,        setMembers]        = useState<Member[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState("");
  const [bookSearch,     setBookSearch]     = useState("");
  const [memberSearch,   setMemberSearch]   = useState("");
  const [selectedBook,   setSelectedBook]   = useState<Book | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [expiryDays,     setExpiryDays]     = useState("30");
  const [customDays,     setCustomDays]     = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setStep(1); setError(""); setSelectedBook(null); setSelectedMember(null);
    setBookSearch(""); setMemberSearch(""); setExpiryDays("30"); setCustomDays(false);
    setLoading(true);
    Promise.all([booksApi.getAll(), membersApi.getAll()])
      .then(([b, m]) => { setBooks(b); setMembers(m); })
      .catch(() => setError("Failed to load data."))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => { bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);

  const goNext = () => {
    if (step === 1 && !selectedBook)   { setError("Pick a book to continue."); return; }
    if (step === 2 && !selectedMember) { setError("Pick a member to continue."); return; }
    setError("");
    setStep(s => (s < 3 ? (s + 1) as 1 | 2 | 3 : s));
  };

  const handleCreate = async () => {
    if (!selectedBook || !selectedMember) return;
    setSaving(true); setError("");
    try {
      await reservationsApi.create({
        bookId: selectedBook._id,
        memberId: selectedMember._id,
        expiryDays: Number(expiryDays),
      });
      toast(`Reservation created for "${selectedBook.title}"`);
      onSuccess(); onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create reservation");
    } finally { setSaving(false); }
  };

  const filteredBooks   = books.filter(b =>
    b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
    b.author.toLowerCase().includes(bookSearch.toLowerCase())
  );
  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 modal-overlay backdrop-blur-sm" onClick={onClose} />

      <div className="relative theme-card sm:rounded-3xl rounded-t-3xl card-shadow-lg border
                      w-full sm:max-w-lg flex flex-col overflow-hidden max-h-[92dvh]"
           style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>

        {/* Top gradient bar */}
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg,#6366f1,#818cf8,#a5b4fc)" }} />

        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-600" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 sm:pt-5 pb-4 border-b border-[var(--color-border-secondary)] flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-theme-primary leading-none">New Reservation</h2>
                <p className="text-[11px] text-theme-muted mt-0.5">
                  {step === 1 ? "Select a book" : step === 2 ? "Select a member" : "Review & confirm"}
                </p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-theme-secondary hover:text-theme-primary btn-ghost-theme transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
          <StepIndicator step={step} />
        </div>

        {/* Body */}
        <div ref={bodyRef} className="flex-1 overflow-y-auto px-5 py-5 min-h-0">
          {error && (
            <div className="mb-4">
              <Alert variant="error">{error}</Alert>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-theme-muted">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
              <p className="text-sm font-medium">Loading…</p>
            </div>
          ) : (
            <>
              {/* ── Step 1: Book ── */}
              {step === 1 && (
                <div>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted pointer-events-none" />
                    <input
                      autoFocus
                      className="w-full border border-[var(--color-border-secondary)] rounded-xl pl-9 pr-9 py-2.5 text-sm bg-[var(--color-background-primary)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition-all"
                      placeholder="Search by title or author…"
                      value={bookSearch}
                      onChange={e => setBookSearch(e.target.value)}
                    />
                    {bookSearch && (
                      <button onClick={() => setBookSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {filteredBooks.length === 0 ? (
                    <p className="text-sm text-theme-muted text-center py-10">No books found</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {filteredBooks.map(b => (
                        <BookCoverCard
                          key={b._id} book={b}
                          selected={selectedBook?._id === b._id}
                          onClick={() => setSelectedBook(b._id === selectedBook?._id ? null : b)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 2: Member ── */}
              {step === 2 && (
                <div>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted pointer-events-none" />
                    <input
                      autoFocus
                      className="w-full border border-[var(--color-border-secondary)] rounded-xl pl-9 pr-9 py-2.5 text-sm bg-[var(--color-background-primary)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition-all"
                      placeholder="Search by name or email…"
                      value={memberSearch}
                      onChange={e => setMemberSearch(e.target.value)}
                    />
                    {memberSearch && (
                      <button onClick={() => setMemberSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {filteredMembers.length === 0 ? (
                    <p className="text-sm text-theme-muted text-center py-10">No members found</p>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {filteredMembers.map(m => (
                        <MemberRowCard
                          key={m._id} member={m}
                          selected={selectedMember?._id === m._id}
                          onClick={() => m.status === "active" && setSelectedMember(
                            m._id === selectedMember?._id ? null : m
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 3: Confirm ── */}
              {step === 3 && selectedBook && selectedMember && (
                <div className="space-y-5">
                  <ReservationTicket book={selectedBook} member={selectedMember} expiryDays={expiryDays} />

                  {/* Expiry duration */}
                  <div>
                    <p className="text-[11px] font-bold text-theme-secondary uppercase tracking-widest mb-3">
                      Reservation Expiry
                    </p>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {EXPIRY_PRESETS.map(p => (
                        <button
                          key={p.days}
                          type="button"
                          onClick={() => { setExpiryDays(p.days); setCustomDays(false); }}
                          className={cn(
                            "py-2.5 rounded-xl border text-center transition-all duration-150 focus:outline-none",
                            !customDays && expiryDays === p.days
                              ? "bg-indigo-500 border-indigo-500 text-white shadow-sm shadow-indigo-200"
                              : "border-[var(--color-border-secondary)] hover:border-indigo-400 bg-[var(--color-background-primary)]"
                          )}
                        >
                          <p className={cn("text-sm font-bold leading-none",
                            !customDays && expiryDays === p.days ? "text-white" : "text-theme-primary"
                          )}>{p.label}</p>
                          <p className={cn("text-[10px] mt-0.5",
                            !customDays && expiryDays === p.days ? "text-white/80" : "text-theme-muted"
                          )}>{p.sublabel}</p>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setCustomDays(!customDays)}
                        className={cn(
                          "text-xs font-semibold px-3 py-2 rounded-lg border transition-all",
                          customDays
                            ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-400 text-indigo-600"
                            : "border-[var(--color-border-secondary)] text-theme-muted hover:border-indigo-400 hover:text-indigo-600"
                        )}
                      >
                        Custom
                      </button>
                      {customDays && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number" min="1" max="365" value={expiryDays}
                            onChange={e => setExpiryDays(e.target.value)}
                            className="w-20 border border-[var(--color-border-secondary)] rounded-lg px-3 py-1.5 text-sm bg-[var(--color-background-primary)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition-all"
                          />
                          <span className="text-sm text-theme-muted">days</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer nav */}
        {!loading && (
          <div className="px-5 py-4 border-t border-[var(--color-border-secondary)] flex gap-3 flex-shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => { setStep(s => (s - 1) as 1 | 2 | 3); setError(""); }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[var(--color-border-secondary)] text-sm font-semibold text-theme-secondary hover:text-theme-primary hover:border-[var(--color-border-primary)] transition-all bg-[var(--color-background-primary)]"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[var(--color-border-secondary)] text-sm font-semibold text-theme-secondary hover:text-theme-primary transition-all bg-[var(--color-background-primary)]"
              >
                Cancel
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={step === 1 ? !selectedBook : !selectedMember}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}
              >
                {step === 1
                  ? <>{selectedBook ? `"${selectedBook.title.slice(0, 20)}${selectedBook.title.length > 20 ? "…" : ""}" — Next` : "Select a Book"}<ArrowRight className="w-3.5 h-3.5" /></>
                  : <>{selectedMember ? `${selectedMember.name} — Confirm` : "Select a Member"}<ArrowRight className="w-3.5 h-3.5" /></>
                }
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-150 disabled:opacity-60 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}
              >
                {saving
                  ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                  : <><CalendarCheck className="w-3.5 h-3.5" /> Create Reservation</>
                }
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Reservations Page
// ═══════════════════════════════════════════════════════════════════════════════
export default function Reservations() {
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [reserveOpen, setReserveOpen] = useState(false);

  const debouncedSearch = useDebounce(search);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reservationsApi.getAll({ search: debouncedSearch, status });
      setReservations(data as Reservation[]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [debouncedSearch, status]);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);

  const handleFulfill = async (id: string, bookTitle: string) => {
    try {
      await reservationsApi.fulfill(id);
      fetchReservations();
      toast(`Reservation for "${bookTitle}" fulfilled — issue created`);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "Failed to fulfill reservation", "error");
    }
  };

  const handleCancel = async (id: string, bookTitle: string) => {
    try {
      await reservationsApi.cancel(id);
      fetchReservations();
      toast(`Reservation for "${bookTitle}" cancelled`);
    } catch { toast("Failed to cancel reservation", "error"); }
  };

  const counts = {
    pending:   reservations.filter(r => r.status === "pending").length,
    fulfilled: reservations.filter(r => r.status === "fulfilled").length,
    cancelled: reservations.filter(r => r.status === "cancelled").length,
    expired:   reservations.filter(r => r.status === "expired").length,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Reservations"
        subtitle={`${counts.pending} pending reservation${counts.pending !== 1 ? "s" : ""}`}
        action={
          <Button onClick={() => setReserveOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Reservation
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Pending",   value: counts.pending,   icon: Clock,       cls: "icon-bg-amber text-amber-600" },
          { label: "Fulfilled", value: counts.fulfilled, icon: CheckCircle, cls: "icon-bg-emerald text-emerald-600" },
          { label: "Cancelled", value: counts.cancelled, icon: XCircle,     cls: "icon-bg-red text-red-600" },
          { label: "Expired",   value: counts.expired,   icon: Calendar,    cls: "bg-[var(--skeleton-bg)] text-theme-muted" },
        ].map(({ label, value, icon: Icon, cls }) => (
          <Card key={label} className="p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${cls}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xl sm:text-3xl font-bold text-theme-primary leading-none tabular-nums">{value}</p>
              <p className="text-xs text-theme-muted font-semibold mt-1">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search reservations…" />
          <Select value={status} onChange={setStatus} options={statusOptions} className="w-full sm:w-auto sm:min-w-36" />
        </div>
      </Card>

      <Card>
        <Table>
          <thead>
            <tr>
              <Th className="hidden sm:table-cell">#</Th>
              <Th>Book</Th>
              <Th>Member</Th>
              <Th className="hidden sm:table-cell">Reserved On</Th>
              <Th className="hidden sm:table-cell">Expires</Th>
              <Th className="hidden sm:table-cell">Queue</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={6} cols={8} />
            ) : reservations.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <Empty message="No reservations found" hint="Use 'New Reservation' to add one" icon={CalendarCheck} />
                </td>
              </tr>
            ) : reservations.map((res) => (
              <tr key={res._id} className="hover:bg-[var(--bg-card-hover)]/60 transition-colors">
                <Td className="hidden sm:table-cell">
                  <span className="text-theme-tertiary font-mono text-xs">#{res._id.slice(-4)}</span>
                </Td>
                <Td><p className="font-bold text-theme-primary text-sm">{res.bookTitle}</p></Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-700 text-xs font-bold">{res.memberName[0]}</span>
                    </div>
                    <span className="text-sm text-theme-primary font-medium">{res.memberName}</span>
                  </div>
                </Td>
                <Td className="hidden sm:table-cell"><span className="text-theme-secondary font-medium">{formatDate(res.reservationDate)}</span></Td>
                <Td className="hidden sm:table-cell"><span className="text-theme-secondary font-medium">{formatDate(res.expiryDate)}</span></Td>
                <Td className="hidden sm:table-cell">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                    {res.queuePosition}
                  </span>
                </Td>
                <Td><Badge variant={statusBadge[res.status]} dot>{res.status}</Badge></Td>
                <Td>
                  {res.status === "pending" && (
                    <div className="flex gap-1.5">
                      <Button
                        variant="ghost"
                        className="text-xs px-3 py-2 min-h-[36px] text-emerald-600 hover:icon-bg-emerald hover:text-emerald-700"
                        onClick={() => handleFulfill(res._id, res.bookTitle)}
                      >
                        <CheckCircle className="w-3 h-3" /> Fulfill
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-xs px-3 py-2 min-h-[36px] text-red-500 hover:icon-bg-red"
                        onClick={() => handleCancel(res._id, res.bookTitle)}
                      >
                        <XCircle className="w-3 h-3" /> Cancel
                      </Button>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {!loading && <TableFooter total={reservations.length} />}
      </Card>

      <ReserveOverlay
        open={reserveOpen}
        onClose={() => setReserveOpen(false)}
        onSuccess={fetchReservations}
      />
    </div>
  );
}
