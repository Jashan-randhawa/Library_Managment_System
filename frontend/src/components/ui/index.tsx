import { X, BookOpen, CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "../../lib/utils";

// ─── Badge ───────────────────────────────────────────────────────────────────
type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "neutral";

const badgeConfig: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  default: { bg: "bg-indigo-50",  text: "text-indigo-700", dot: "bg-indigo-500" },
  success: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  warning: { bg: "bg-amber-50",   text: "text-amber-700",  dot: "bg-amber-500" },
  danger:  { bg: "bg-red-50",     text: "text-red-700",    dot: "bg-red-500" },
  info:    { bg: "bg-sky-50",     text: "text-sky-700",    dot: "bg-sky-500" },
  neutral: { bg: "bg-slate-100",  text: "text-slate-600",  dot: "bg-slate-400" },
};

export function Badge({
  children,
  variant = "default",
  dot = false,
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}) {
  const cfg = badgeConfig[variant];
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide",
      cfg.bg, cfg.text, className
    )}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} />}
      {children}
    </span>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-2xl border border-slate-100 card-shadow", className)}>
      {children}
    </div>
  );
}

// ─── Button ──────────────────────────────────────────────────────────────────
type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:   "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 active:scale-95",
  secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm",
  danger:    "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-100 active:scale-95",
  ghost:     "text-slate-600 hover:bg-slate-100 hover:text-slate-800",
  outline:   "border border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100",
};

export function Button({
  children,
  variant = "primary",
  className,
  onClick,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none",
        buttonVariants[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────
export function Input({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  className,
}: {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition-all shadow-sm"
      />
    </div>
  );
}

// ─── Select ──────────────────────────────────────────────────────────────────
export function Select({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition-all shadow-sm cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
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
    <th className={cn(
      "px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/80",
      className
    )}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn(
      "px-5 py-3.5 text-slate-700 border-b border-slate-50 whitespace-nowrap",
      className
    )}>
      {children}
    </td>
  );
}

// ─── TableFooter ─────────────────────────────────────────────────────────────
export function TableFooter({ total, filtered }: { total: number; filtered?: number }) {
  return (
    <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl flex items-center justify-between">
      <p className="text-xs text-slate-400 font-medium">
        {filtered !== undefined && filtered !== total
          ? `Showing ${filtered} of ${total} results`
          : `${total} result${total !== 1 ? "s" : ""} total`}
      </p>
    </div>
  );
}

// ─── PageHeader ──────────────────────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-7">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-slate-400 mt-0.5 font-medium">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── StatCard ────────────────────────────────────────────────────────────────
type StatColor = "indigo" | "emerald" | "sky" | "red" | "amber";

const statColorMap: Record<StatColor, {
  icon: string;
  glow: string;
  accent: string;
  value: string;
}> = {
  indigo:  { icon: "bg-indigo-500",  glow: "stat-card-glow-indigo",  accent: "bg-indigo-500", value: "text-indigo-600" },
  emerald: { icon: "bg-emerald-500", glow: "stat-card-glow-emerald", accent: "bg-emerald-500", value: "text-emerald-600" },
  sky:     { icon: "bg-sky-500",     glow: "stat-card-glow-sky",     accent: "bg-sky-500", value: "text-sky-600" },
  red:     { icon: "bg-red-500",     glow: "stat-card-glow-red",     accent: "bg-red-500", value: "text-red-600" },
  amber:   { icon: "bg-amber-500",   glow: "stat-card-glow-amber",   accent: "bg-amber-500", value: "text-amber-600" },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = "indigo",
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: string; positive: boolean };
  color?: StatColor;
  subtitle?: string;
}) {
  const cfg = statColorMap[color];

  return (
    <div className={cn("bg-white rounded-2xl border border-slate-100 p-5 relative overflow-hidden", cfg.glow)}>
      <div className={cn("absolute top-0 left-0 right-0 h-0.5", cfg.accent)} />
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">{title}</p>
          <p className="text-3xl font-bold text-slate-900 tabular-nums leading-none">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1.5">{subtitle}</p>}
          {trend && (
            <p className={cn("text-xs mt-2 font-semibold flex items-center gap-1", trend.positive ? "text-emerald-600" : "text-red-500")}>
              <span>{trend.positive ? "▲" : "▼"}</span>
              <span>{trend.value}</span>
            </p>
          )}
        </div>
        <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ml-3 shadow-sm", cfg.icon)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-slate-100", className)} />;
}

export function SkeletonStatCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 card-shadow">
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
            <td key={j} className="px-5 py-4 border-b border-slate-50">
              <Skeleton className={cn("h-4", j === 0 ? "w-36" : j === cols - 1 ? "w-16" : "w-24")} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Empty ───────────────────────────────────────────────────────────────────
export function Empty({
  message,
  hint,
  icon: Icon = BookOpen,
}: {
  message: string;
  hint?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="py-16 text-center flex flex-col items-center gap-3">
      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
        <Icon className="w-7 h-7 text-slate-300" />
      </div>
      <div>
        <p className="text-slate-600 text-sm font-semibold">{message}</p>
        {hint && <p className="text-slate-400 text-xs mt-1">{hint}</p>}
      </div>
    </div>
  );
}

// ─── Alert ───────────────────────────────────────────────────────────────────
type AlertVariant = "error" | "warning" | "info" | "success";

const alertConfig: Record<AlertVariant, { bg: string; border: string; text: string; Icon: React.ElementType }> = {
  error:   { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-700",    Icon: XCircle },
  warning: { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700",  Icon: AlertTriangle },
  info:    { bg: "bg-sky-50",    border: "border-sky-200",    text: "text-sky-700",    Icon: Info },
  success: { bg: "bg-emerald-50",border: "border-emerald-200",text: "text-emerald-700",Icon: CheckCircle },
};

export function Alert({ children, variant = "error" }: { children: React.ReactNode; variant?: AlertVariant }) {
  const cfg = alertConfig[variant];
  return (
    <div className={cn("flex items-start gap-2.5 px-3.5 py-3 rounded-xl border text-sm", cfg.bg, cfg.border, cfg.text)}>
      <cfg.Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl card-shadow-md w-full max-w-md border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ml-3 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── MiniStatCard (for page-level stats) ─────────────────────────────────────
export function MiniStatCard({
  label,
  value,
  icon: Icon,
  colorClass,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  colorClass: string;
}) {
  return (
    <Card className="p-4 flex items-center gap-3.5">
      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0", colorClass)}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div>
        <p className="text-xl font-bold text-slate-800 leading-none">{value}</p>
        <p className="text-xs text-slate-400 font-medium mt-1">{label}</p>
      </div>
    </Card>
  );
}

// ─── SearchBar ───────────────────────────────────────────────────────────────
export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative flex-1 min-w-48", className)}>
      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition-all shadow-sm"
      />
    </div>
  );
}
