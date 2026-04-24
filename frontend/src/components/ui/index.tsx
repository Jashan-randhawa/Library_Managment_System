import { X, BookOpen, CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "../../lib/utils";

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "neutral";

const badgeConfig: Record<BadgeVariant, { bg: string; text: string; dot: string; border: string }> = {
  default: { bg: "badge-indigo",  text: "text-indigo-600 dark:text-indigo-400",  dot: "bg-indigo-500",  border: "border-indigo-200/50 dark:border-indigo-500/30" },
  success: { bg: "badge-emerald", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500", border: "border-emerald-200/50 dark:border-emerald-500/30" },
  warning: { bg: "badge-amber",   text: "text-amber-600 dark:text-amber-400",   dot: "bg-amber-500",   border: "border-amber-200/50 dark:border-amber-500/30" },
  danger:  { bg: "badge-red",     text: "text-red-600 dark:text-red-400",     dot: "bg-red-500",     border: "border-red-200/50 dark:border-red-500/30" },
  info:    { bg: "badge-sky",     text: "text-sky-600 dark:text-sky-400",     dot: "bg-sky-500",     border: "border-sky-200/50 dark:border-sky-500/30" },
  neutral: { bg: "badge-slate",   text: "text-slate-600 dark:text-slate-400",   dot: "bg-slate-400",   border: "border-slate-200/50 dark:border-slate-500/30" },
};

export function Badge({ children, variant = "default", dot = false, className }: {
  children: React.ReactNode; variant?: BadgeVariant; dot?: boolean; className?: string;
}) {
  const cfg = badgeConfig[variant];
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border",
      cfg.bg, cfg.text, cfg.border, className
    )}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} />}
      {children}
    </span>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("theme-card rounded-2xl border card-shadow", className)}>
      {children}
    </div>
  );
}

// ─── Button ──────────────────────────────────────────────────────────────────
type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";

export function Button({ children, variant = "primary", className, onClick, disabled, type = "button" }: {
  children: React.ReactNode; variant?: ButtonVariant; className?: string;
  onClick?: () => void; disabled?: boolean; type?: "button" | "submit";
}) {
  const base = "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 select-none active:scale-[0.97]";

  if (variant === "primary") return (
    <button type={type} disabled={disabled} onClick={onClick}
      className={cn(base, "text-white shadow-sm hover:brightness-110", className)}
      style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
      {children}
    </button>
  );
  if (variant === "secondary") return (
    <button type={type} disabled={disabled} onClick={onClick}
      className={cn(base, "btn-secondary-theme border hover:scale-[0.98]", className)}>
      {children}
    </button>
  );
  if (variant === "danger") return (
    <button type={type} disabled={disabled} onClick={onClick}
      className={cn(base, "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-100", className)}>
      {children}
    </button>
  );
  if (variant === "ghost") return (
    <button type={type} disabled={disabled} onClick={onClick}
      className={cn(base, "btn-ghost-theme", className)}>
      {children}
    </button>
  );
  // outline
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      className={cn(base, "border border-green-500/40 text-green-600 dark:text-green-400 bg-green-50/60 dark:bg-green-500/10 hover:bg-green-100 dark:hover:bg-green-500/20", className)}>
      {children}
    </button>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────
export function Input({ label, placeholder, value, onChange, type = "text", inputMode, autoComplete, className }: {
  label?: string; placeholder?: string; value: string; onChange: (v: string) => void;
  type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string; className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <label className="text-[11px] font-bold text-theme-secondary uppercase tracking-[0.1em]">{label}</label>}
      <input
        type={type} inputMode={inputMode} autoComplete={autoComplete}
        placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
        className="theme-input px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-500/25 focus:border-green-400 transition-all duration-200 shadow-sm"
      />
    </div>
  );
}

// ─── Select ──────────────────────────────────────────────────────────────────
export function Select({ label, value, onChange, options, className }: {
  label?: string; value: string; onChange: (v: string) => void;
  options: { label: string; value: string }[]; className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <label className="text-[11px] font-bold text-theme-secondary uppercase tracking-[0.1em]">{label}</label>}
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="theme-input w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-500/25 focus:border-green-400 transition-all duration-200 shadow-sm cursor-pointer">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ─── Table ───────────────────────────────────────────────────────────────────
export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full text-sm text-left">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn("theme-th px-4 sm:px-5 py-3 sm:py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] border-b whitespace-nowrap", className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn("theme-td px-4 sm:px-5 py-3 sm:py-3.5 border-b", className)}>
      {children}
    </td>
  );
}

export function TableFooter({ total, filtered }: { total: number; filtered?: number }) {
  return (
    <div className="theme-card px-5 py-3 border-t border-theme-divider rounded-b-2xl flex items-center justify-between">
      <p className="text-xs text-theme-secondary font-bold">
        {filtered !== undefined && filtered !== total
          ? `Showing ${filtered} of ${total} results`
          : `${total} result${total !== 1 ? "s" : ""} total`}
      </p>
    </div>
  );
}

// ─── PageHeader ──────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap mb-7">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-theme-primary tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-theme-secondary mt-0.5 font-medium">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// ─── StatCard ────────────────────────────────────────────────────────────────
type StatColor = "indigo" | "emerald" | "sky" | "red" | "amber";

const statColorMap: Record<StatColor, { iconStyle: string; glow: string; accent: string }> = {
  indigo:  { iconStyle: "icon-indigo",  glow: "stat-card-glow-indigo",  accent: "bg-indigo-500" },
  emerald: { iconStyle: "icon-emerald", glow: "stat-card-glow-emerald", accent: "bg-emerald-500" },
  sky:     { iconStyle: "icon-sky",     glow: "stat-card-glow-sky",     accent: "bg-sky-500" },
  red:     { iconStyle: "icon-red",     glow: "stat-card-glow-red",     accent: "bg-red-500" },
  amber:   { iconStyle: "icon-amber",   glow: "stat-card-glow-amber",   accent: "bg-amber-500" },
};

export function StatCard({ title, value, icon: Icon, trend, color = "indigo", subtitle }: {
  title: string; value: string | number; icon: React.ElementType;
  trend?: { value: string; positive: boolean }; color?: StatColor; subtitle?: string;
}) {
  const cfg = statColorMap[color];
  return (
    <div className={cn("theme-card rounded-2xl border p-4 sm:p-5 relative overflow-hidden transition-all duration-200 hover:translate-y-[-1px]", cfg.glow)}>
      <div className={cn("absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl", cfg.accent)} />
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-[11px] font-bold text-theme-secondary uppercase tracking-[0.12em] mb-2">{title}</p>
          <p className="text-2xl sm:text-[2rem] font-bold text-theme-primary tabular-nums leading-none">{value}</p>
          {subtitle && <p className="text-[11px] sm:text-xs text-theme-secondary mt-1.5 font-medium leading-tight">{subtitle}</p>}
          {trend && (
            <p className={cn("text-[11px] sm:text-xs mt-2 font-semibold flex items-center gap-1", trend.positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400")}>
              <span>{trend.positive ? "▲" : "▼"}</span>
              <span className="truncate">{trend.value}</span>
            </p>
          )}
        </div>
        <div className={cn("w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 ml-2 sm:ml-3 shadow-md", cfg.iconStyle)}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl theme-skeleton", className)} />;
}

export function SkeletonStatCard() {
  return (
    <div className="theme-card rounded-2xl border p-5 card-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-3 w-24 mb-3" />
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="w-11 h-11 rounded-2xl" />
      </div>
    </div>
  );
}

export function SkeletonRows({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-5 py-4 border-b border-theme-table">
              <Skeleton className={cn("h-4", j === 0 ? "w-36" : j === cols - 1 ? "w-16" : "w-24")} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Empty ───────────────────────────────────────────────────────────────────
export function Empty({ message, hint, icon: Icon = BookOpen }: {
  message: string; hint?: string; icon?: React.ElementType;
}) {
  return (
    <div className="py-16 text-center flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-2xl theme-card border flex items-center justify-center shadow-sm">
        <Icon className="w-7 h-7 text-theme-tertiary" />
      </div>
      <div>
        <p className="text-theme-primary text-sm font-semibold">{message}</p>
        {hint && <p className="text-theme-secondary text-xs mt-1 font-medium">{hint}</p>}
      </div>
    </div>
  );
}

// ─── Alert ───────────────────────────────────────────────────────────────────
type AlertVariant = "error" | "warning" | "info" | "success";

const alertConfig: Record<AlertVariant, { bg: string; border: string; text: string; Icon: React.ElementType }> = {
  error:   { bg: "badge-red",     border: "border-red-200/50 dark:border-red-500/30",     text: "text-red-700 dark:text-red-400",    Icon: XCircle },
  warning: { bg: "badge-amber",   border: "border-amber-200/50 dark:border-amber-500/30", text: "text-amber-700 dark:text-amber-400", Icon: AlertTriangle },
  info:    { bg: "badge-sky",     border: "border-sky-200/50 dark:border-sky-500/30",     text: "text-sky-700 dark:text-sky-400",    Icon: Info },
  success: { bg: "badge-emerald", border: "border-emerald-200/50 dark:border-emerald-500/30", text: "text-emerald-700 dark:text-emerald-400", Icon: CheckCircle },
};

export function Alert({ children, variant = "error" }: { children: React.ReactNode; variant?: AlertVariant }) {
  const cfg = alertConfig[variant];
  return (
    <div className={cn("flex items-start gap-2.5 px-3.5 py-3 rounded-xl border text-sm font-medium", cfg.bg, cfg.border, cfg.text)}>
      <cfg.Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, subtitle, children }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 modal-overlay backdrop-blur-sm" onClick={onClose} />
      <div className="relative theme-card sm:rounded-3xl rounded-t-3xl card-shadow-lg w-full sm:max-w-md border overflow-hidden max-h-[92dvh] flex flex-col" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #22c55e, #4ade80, #86efac)" }} />
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-600" />
        </div>
        <div className="flex items-start justify-between px-6 pt-3 sm:pt-5 pb-4 border-b border-theme-divider">
          <div>
            <h2 className="text-base font-bold text-theme-primary tracking-tight">{title}</h2>
            {subtitle && <p className="text-xs text-theme-secondary mt-0.5 font-medium">{subtitle}</p>}
          </div>
          <button onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-theme-secondary hover:text-theme-primary btn-ghost-theme transition-all ml-3 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ─── MiniStatCard ─────────────────────────────────────────────────────────────
export function MiniStatCard({ label, value, icon: Icon, colorClass }: {
  label: string; value: string | number; icon: React.ElementType; colorClass: string;
}) {
  return (
    <Card className="p-4 flex items-center gap-3.5 hover:translate-y-[-1px] transition-transform duration-200">
      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm", colorClass)}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div>
        <p className="text-xl font-bold text-theme-primary leading-none tabular-nums">{value}</p>
        <p className="text-xs text-theme-secondary font-medium mt-1">{label}</p>
      </div>
    </Card>
  );
}

// ─── SearchBar ───────────────────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = "Search...", className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <div className={cn("relative flex-1 min-w-0 w-full sm:min-w-48", className)}>
      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-tertiary pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
        className="theme-input w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-500/25 focus:border-green-400 transition-all duration-200 shadow-sm"
      />
    </div>
  );
}
