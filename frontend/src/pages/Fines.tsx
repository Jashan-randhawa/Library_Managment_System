import { useState, useEffect, useCallback, useRef } from "react";
import {
  IndianRupee, CheckCircle, XCircle, MinusCircle, Plus,
  ArrowRight, ArrowLeft, Search, X, BookOpen, Calendar,
  RefreshCw, AlertTriangle, Hash,
} from "lucide-react";
import {
  PageHeader, Card, Badge, Select, Table, Th, Td, TableFooter,
  Button, Empty, SkeletonRows, SearchBar, Alert,
} from "../components/ui";
import { finesApi, membersApi, loansApi } from "../lib/api";
import type { Member, Loan } from "../types";
import { formatDate, formatCurrency, useDebounce, cn } from "../lib/utils";
import { useToast } from "../components/Toast";

interface Fine {
  _id: string;
  memberName: string;
  bookTitle: string;
  reason: string;
  amount: number;
  issuedDate: string;
  paidDate?: string;
  status: string;
}

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "unpaid", label: "Unpaid" },
  { value: "paid", label: "Paid" },
  { value: "waived", label: "Waived" },
];

const statusBadge: Record<string, "danger" | "success" | "neutral"> = {
  unpaid: "danger", paid: "success", waived: "neutral",
};

// ── Palette helpers ───────────────────────────────────────────────────────────
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

const AMOUNT_PRESETS = [
  { label: "₹10",  days: "10"  },
  { label: "₹25",  days: "25"  },
  { label: "₹50",  days: "50"  },
  { label: "₹100", days: "100" },
];

const REASON_PRESETS = [
  "Overdue return",
  "Damaged book",
  "Lost book",
  "Manual fine",
];

// ── Step Indicator ────────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Member"  },
    { n: 2, label: "Issue"   },
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
                done   ? "bg-red-500 text-white shadow-sm shadow-red-200"
                       : active
                         ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 ring-2 ring-red-400"
                         : "bg-[var(--color-background-secondary)] text-theme-muted"
              )}>
                {done ? <CheckCircle className="w-4 h-4" /> : s.n}
              </div>
              <span className={cn("text-[10px] font-bold tracking-wide",
                active ? "text-red-600 dark:text-red-400" : done ? "text-red-500" : "text-theme-muted"
              )}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                "w-12 sm:w-16 h-px mx-1 mb-4 transition-all duration-300",
                done ? "bg-red-400" : "bg-[var(--color-border-secondary)]"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Member Row Card ───────────────────────────────────────────────────────────
function MemberRowCard({ member, selected, onClick }: { member: Member; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl border p-3 flex items-center gap-3 transition-all duration-200 focus:outline-none",
        selected
          ? "border-red-400 bg-red-50 dark:bg-red-900/20 shadow-sm shadow-red-100"
          : "border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)] hover:border-[var(--color-border-secondary)] hover:bg-[var(--color-background-secondary)]"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm font-bold bg-gradient-to-br shadow-sm",
        avatarGradient(member.name)
      )}>
        {member.name[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-bold truncate", selected ? "text-red-700 dark:text-red-300" : "text-theme-primary")}>
          {member.name}
        </p>
        <p className="text-[11px] text-theme-muted truncate">{member.email}</p>
        {member.finesOwed > 0 && (
          <span className="text-[10px] font-bold text-amber-600">₹{member.finesOwed} outstanding</span>
        )}
      </div>
      {selected && <CheckCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
    </button>
  );
}

// ── Loan Row Card ─────────────────────────────────────────────────────────────
function LoanRowCard({ loan, selected, onClick }: {
  loan: Loan; selected: boolean; onClick: () => void
}) {
  const pal = coverPalette(loan.bookTitle);
  const isOverdue = loan.status === "overdue";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl border p-3 flex items-center gap-3 transition-all duration-200 focus:outline-none",
        selected
          ? "border-red-400 bg-red-50 dark:bg-red-900/20 shadow-sm"
          : "border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)] hover:border-[var(--color-border-secondary)] hover:bg-[var(--color-background-secondary)]"
      )}
    >
      {/* Mini cover */}
      <div
        className="w-9 h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
        style={{ background: `linear-gradient(145deg, ${pal.from}, ${pal.to})` }}
      >
        <BookOpen className="w-4 h-4 text-white/90" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-bold truncate", selected ? "text-red-700 dark:text-red-300" : "text-theme-primary")}>
          {loan.bookTitle}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full",
            isOverdue
              ? "bg-red-100 text-red-600 dark:bg-red-900/30"
              : loan.status === "returned"
                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"
                : "bg-sky-100 text-sky-600 dark:bg-sky-900/30"
          )}>
            {loan.status}
          </span>
          <span className="text-[10px] text-theme-muted flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" /> due {formatDate(loan.dueDate)}
          </span>
        </div>
      </div>

      {isOverdue && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
      {selected && <CheckCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
    </button>
  );
}

// ── Fine Ticket (step 3) ──────────────────────────────────────────────────────
function FineTicket({ member, loan, amount, reason }: {
  member: Member; loan: Loan; amount: string; reason: string;
}) {
  const pal = coverPalette(loan.bookTitle);

  return (
    <div className="rounded-2xl overflow-hidden border border-[var(--color-border-secondary)] shadow-md">
      {/* Header band */}
      <div
        className="px-5 py-3.5 flex items-center gap-3"
        style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
      >
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-inner flex-shrink-0">
          <IndianRupee className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm leading-tight">Fine Notice</p>
          <p className="text-white/70 text-[11px] mt-0.5 capitalize">{reason}</p>
        </div>
        <div className="ml-auto text-right flex-shrink-0">
          <p className="text-white/70 text-[10px] uppercase tracking-widest">Amount</p>
          <p className="text-white font-bold text-xl leading-tight">
            {amount ? formatCurrency(Number(amount)) : "—"}
          </p>
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
            <Hash className="w-3 h-3" /> Member
          </p>
          <p className="text-sm font-bold text-theme-primary">{member.name}</p>
          <p className="text-[11px] text-theme-muted">{member.email}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest mb-1 flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> Book
          </p>
          <p className="text-sm font-bold text-theme-primary line-clamp-2">{loan.bookTitle}</p>
          <div
            className="inline-block w-3 h-3 rounded-sm mt-0.5"
            style={{ background: `linear-gradient(135deg, ${pal.from}, ${pal.to})` }}
          />
        </div>
        <div>
          <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Issue Status
          </p>
          <p className={cn("text-sm font-bold capitalize",
            loan.status === "overdue" ? "text-red-500" : "text-theme-primary"
          )}>
            {loan.status}
          </p>
          <p className="text-[11px] text-theme-muted">due {formatDate(loan.dueDate)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Issued On
          </p>
          <p className="text-sm font-bold text-theme-primary">{formatDate(new Date().toISOString())}</p>
          <p className="text-[11px] text-theme-muted">today</p>
        </div>
      </div>

      {member.finesOwed > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 px-5 py-2.5 border-t border-amber-200 dark:border-amber-800">
          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
            ⚠ Member already has ₹{member.finesOwed} in outstanding fines
          </p>
        </div>
      )}
    </div>
  );
}

// ── Add Fine Overlay ──────────────────────────────────────────────────────────
function AddFineOverlay({
  open, onClose, onSuccess,
}: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const { toast } = useToast();
  const [step,           setStep]           = useState<1 | 2 | 3>(1);
  const [members,        setMembers]        = useState<Member[]>([]);
  const [allLoans,       setAllLoans]       = useState<Loan[]>([]);
  const [memberLoans,    setMemberLoans]    = useState<Loan[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState("");
  const [memberSearch,   setMemberSearch]   = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedLoan,   setSelectedLoan]   = useState<Loan | null>(null);
  const [amount,         setAmount]         = useState("");
  const [customAmount,   setCustomAmount]   = useState(false);
  const [reason,         setReason]         = useState("Overdue return");
  const [customReason,   setCustomReason]   = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setStep(1); setError("");
    setSelectedMember(null); setSelectedLoan(null); setMemberLoans([]);
    setMemberSearch(""); setAmount(""); setCustomAmount(false);
    setReason("Overdue return"); setCustomReason(false);
    setLoading(true);
    Promise.all([membersApi.getAll(), loansApi.getAll()])
      .then(([m, l]) => { setMembers(m); setAllLoans(l as unknown as Loan[]); })
      .catch(() => setError("Failed to load data."))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => { bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);

  const handleSelectMember = (m: Member) => {
    setSelectedMember(prev => prev?._id === m._id ? null : m);
    setSelectedLoan(null);
    const ml = allLoans.filter(l => (l as unknown as { memberId: string }).memberId === m._id);
    setMemberLoans(ml);
  };

  const goNext = () => {
    if (step === 1 && !selectedMember) { setError("Pick a member to continue."); return; }
    if (step === 2 && !selectedLoan)   { setError("Pick a loan to continue."); return; }
    setError("");
    setStep(s => (s < 3 ? (s + 1) as 1 | 2 | 3 : s));
  };

  const handleCreate = async () => {
    if (!selectedMember || !selectedLoan) return;
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }
    setSaving(true); setError("");
    try {
      await finesApi.create({
        memberId: selectedMember._id,
        loanId: selectedLoan._id,
        amount: Number(amount),
        reason: reason || "Manual fine",
      });
      toast(`Fine of ₹${amount} added for ${selectedMember.name}`);
      onSuccess(); onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add fine");
    } finally { setSaving(false); }
  };

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
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg,#ef4444,#f87171,#fca5a5)" }} />

        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-600" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 sm:pt-5 pb-4 border-b border-[var(--color-border-secondary)] flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                <IndianRupee className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-theme-primary leading-none">Add Fine</h2>
                <p className="text-[11px] text-theme-muted mt-0.5">
                  {step === 1 ? "Select a member" : step === 2 ? "Select an issue" : "Review & confirm"}
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
              <RefreshCw className="w-6 h-6 animate-spin text-red-500" />
              <p className="text-sm font-medium">Loading…</p>
            </div>
          ) : (
            <>
              {/* ── Step 1: Member ── */}
              {step === 1 && (
                <div>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted pointer-events-none" />
                    <input
                      autoFocus
                      className="w-full border border-[var(--color-border-secondary)] rounded-xl pl-9 pr-9 py-2.5 text-sm bg-[var(--color-background-primary)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-red-400 transition-all"
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
                          onClick={() => handleSelectMember(m)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 2: Issue ── */}
              {step === 2 && (
                <div>
                  {selectedMember && (
                    <div className="mb-4 px-3 py-2.5 rounded-xl bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] flex items-center gap-2.5">
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold bg-gradient-to-br",
                        avatarGradient(selectedMember.name)
                      )}>
                        {selectedMember.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-theme-primary">{selectedMember.name}</p>
                        <p className="text-[11px] text-theme-muted">{selectedMember.email}</p>
                      </div>
                    </div>
                  )}

                  {memberLoans.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-sm text-theme-muted font-medium">No issues found for this member</p>
                      <p className="text-xs text-theme-muted mt-1">Go back and select a different member</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {memberLoans.map(l => (
                        <LoanRowCard
                          key={l._id} loan={l}
                          selected={selectedLoan?._id === l._id}
                          onClick={() => setSelectedLoan(prev => prev?._id === l._id ? null : l)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 3: Confirm ── */}
              {step === 3 && selectedMember && selectedLoan && (
                <div className="space-y-5">
                  <FineTicket
                    member={selectedMember}
                    loan={selectedLoan}
                    amount={amount}
                    reason={reason}
                  />

                  {/* Amount */}
                  <div>
                    <p className="text-[11px] font-bold text-theme-secondary uppercase tracking-widest mb-3">
                      Fine Amount
                    </p>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {AMOUNT_PRESETS.map(p => (
                        <button
                          key={p.days}
                          type="button"
                          onClick={() => { setAmount(p.days); setCustomAmount(false); }}
                          className={cn(
                            "py-2.5 rounded-xl border text-center transition-all duration-150 focus:outline-none",
                            !customAmount && amount === p.days
                              ? "bg-red-500 border-red-500 text-white shadow-sm shadow-red-200"
                              : "border-[var(--color-border-secondary)] hover:border-red-400 bg-[var(--color-background-primary)]"
                          )}
                        >
                          <p className={cn("text-sm font-bold",
                            !customAmount && amount === p.days ? "text-white" : "text-theme-primary"
                          )}>{p.label}</p>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => { setCustomAmount(!customAmount); if (!customAmount) setAmount(""); }}
                        className={cn(
                          "text-xs font-semibold px-3 py-2 rounded-lg border transition-all",
                          customAmount
                            ? "bg-red-50 dark:bg-red-900/20 border-red-400 text-red-600"
                            : "border-[var(--color-border-secondary)] text-theme-muted hover:border-red-400 hover:text-red-600"
                        )}
                      >
                        Custom
                      </button>
                      {customAmount && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-theme-muted">₹</span>
                          <input
                            autoFocus
                            type="number" min="1" value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0"
                            className="w-24 border border-[var(--color-border-secondary)] rounded-lg px-3 py-1.5 text-sm bg-[var(--color-background-primary)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-red-400 transition-all"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <p className="text-[11px] font-bold text-theme-secondary uppercase tracking-widest mb-3">
                      Reason
                    </p>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {REASON_PRESETS.map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => { setReason(r); setCustomReason(false); }}
                          className={cn(
                            "py-2 px-3 rounded-xl border text-left text-xs font-semibold transition-all duration-150 focus:outline-none",
                            !customReason && reason === r
                              ? "bg-red-500 border-red-500 text-white shadow-sm"
                              : "border-[var(--color-border-secondary)] hover:border-red-400 bg-[var(--color-background-primary)] text-theme-secondary"
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => { setCustomReason(!customReason); if (!customReason) setReason(""); }}
                        className={cn(
                          "text-xs font-semibold px-3 py-2 rounded-lg border transition-all",
                          customReason
                            ? "bg-red-50 dark:bg-red-900/20 border-red-400 text-red-600"
                            : "border-[var(--color-border-secondary)] text-theme-muted hover:border-red-400 hover:text-red-600"
                        )}
                      >
                        Custom
                      </button>
                      {customReason && (
                        <input
                          autoFocus
                          type="text"
                          value={reason}
                          onChange={e => setReason(e.target.value)}
                          placeholder="Enter reason…"
                          className="flex-1 border border-[var(--color-border-secondary)] rounded-lg px-3 py-1.5 text-sm bg-[var(--color-background-primary)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-red-400 transition-all"
                        />
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
                disabled={step === 1 ? !selectedMember : !selectedLoan}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}
              >
                {step === 1
                  ? <>{selectedMember ? `${selectedMember.name} — Next` : "Select a Member"}<ArrowRight className="w-3.5 h-3.5" /></>
                  : <>{selectedLoan ? `${selectedLoan.bookTitle.slice(0, 22)}${selectedLoan.bookTitle.length > 22 ? "…" : ""} — Confirm` : "Select a Loan"}<ArrowRight className="w-3.5 h-3.5" /></>
                }
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreate}
                disabled={saving || !amount || Number(amount) <= 0}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-150 disabled:opacity-60 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}
              >
                {saving
                  ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                  : <><IndianRupee className="w-3.5 h-3.5" /> Add Fine</>
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
// Main Fines Page
// ═══════════════════════════════════════════════════════════════════════════════
export default function Fines() {
  const { toast } = useToast();
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const debouncedSearch = useDebounce(search);

  const fetchFines = useCallback(async () => {
    setLoading(true);
    try {
      const data = await finesApi.getAll({ search: debouncedSearch, status });
      setFines(data as Fine[]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [debouncedSearch, status]);

  useEffect(() => { fetchFines(); }, [fetchFines]);

  const handlePay = async (id: string, memberName: string) => {
    try {
      await finesApi.pay(id);
      fetchFines();
      toast(`Fine for ${memberName} marked as paid`);
    } catch { toast("Failed to update fine", "error"); }
  };

  const handleWaive = async (id: string, memberName: string) => {
    try {
      await finesApi.waive(id);
      fetchFines();
      toast(`Fine for ${memberName} waived`);
    } catch { toast("Failed to waive fine", "error"); }
  };

  const totalUnpaid    = fines.filter(f => f.status === "unpaid").reduce((s, f) => s + f.amount, 0);
  const totalCollected = fines.filter(f => f.status === "paid").reduce((s, f) => s + f.amount, 0);
  const waived         = fines.filter(f => f.status === "waived").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Fines"
        subtitle="Manage overdue and damage fines"
        action={
          <Button onClick={() => setAddOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Fine
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-6">
        {[
          { label: "Outstanding", value: formatCurrency(totalUnpaid),    sub: `${fines.filter(f => f.status === "unpaid").length} unpaid`,  cls: "icon-bg-red text-red-500",               icon: IndianRupee },
          { label: "Collected",   value: formatCurrency(totalCollected), sub: `${fines.filter(f => f.status === "paid").length} paid`,      cls: "icon-bg-emerald text-emerald-500",        icon: CheckCircle },
          { label: "Waived",      value: String(waived),                 sub: "forgiven",                                                    cls: "bg-[var(--skeleton-bg)] text-theme-muted", icon: MinusCircle },
        ].map(({ label, value, sub, cls, icon: Icon }) => (
          <Card key={label} className="p-3 sm:p-5 flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 ${cls}`}>
              <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
            <p className="text-[10px] sm:text-xs font-bold text-theme-muted uppercase tracking-widest mb-1.5">{label}</p>
            <p className="text-lg sm:text-3xl font-bold text-theme-primary tabular-nums truncate w-full">{value}</p>
            <p className="text-xs text-theme-muted mt-1 font-semibold">{sub}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by member or book…" />
          <Select value={status} onChange={setStatus} options={statusOptions} className="w-full sm:w-auto sm:min-w-36" />
        </div>
      </Card>

      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Member</Th>
              <Th className="hidden sm:table-cell">Book</Th>
              <Th className="hidden md:table-cell">Reason</Th>
              <Th>Amount</Th>
              <Th className="hidden sm:table-cell">Issued</Th>
              <Th className="hidden sm:table-cell">Paid On</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={6} cols={8} />
            ) : fines.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <Empty message="No fines found" hint="All clear — no outstanding fines" icon={CheckCircle} />
                </td>
              </tr>
            ) : fines.map((fine) => (
              <tr key={fine._id} className="hover:bg-[var(--bg-card-hover)]/60 transition-colors">
                <Td>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-red-700 text-xs font-bold">{fine.memberName[0]}</span>
                    </div>
                    <span className="font-semibold text-theme-primary text-sm">{fine.memberName}</span>
                  </div>
                </Td>
                <Td className="hidden sm:table-cell">
                  <p className="text-theme-secondary text-sm max-w-40 truncate">{fine.bookTitle}</p>
                </Td>
                <Td className="hidden md:table-cell">
                  <span className="text-theme-secondary text-xs font-medium capitalize">{fine.reason}</span>
                </Td>
                <Td>
                  <span className={`font-bold text-sm ${fine.status === "unpaid" ? "text-red-600" : "text-theme-tertiary line-through"}`}>
                    {formatCurrency(fine.amount)}
                  </span>
                </Td>
                <Td className="hidden sm:table-cell"><span className="text-theme-muted">{formatDate(fine.issuedDate)}</span></Td>
                <Td className="hidden sm:table-cell">
                  <span className="text-theme-muted">{fine.paidDate ? formatDate(fine.paidDate) : "—"}</span>
                </Td>
                <Td><Badge variant={statusBadge[fine.status]} dot>{fine.status}</Badge></Td>
                <Td>
                  {fine.status === "unpaid" && (
                    <div className="flex gap-1.5">
                      <Button
                        variant="ghost"
                        className="text-xs px-3 py-2 min-h-[36px] text-emerald-600 hover:icon-bg-emerald hover:text-emerald-700"
                        onClick={() => handlePay(fine._id, fine.memberName)}
                      >
                        <CheckCircle className="w-3 h-3" /> Paid
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-xs px-3 py-2 min-h-[36px] text-theme-muted hover:bg-[var(--skeleton-bg)]"
                        onClick={() => handleWaive(fine._id, fine.memberName)}
                      >
                        <XCircle className="w-3 h-3" /> Waive
                      </Button>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {!loading && <TableFooter total={fines.length} />}
      </Card>

      <AddFineOverlay
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={fetchFines}
      />
    </div>
  );
}
