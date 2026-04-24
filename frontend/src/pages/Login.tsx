import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { Library, Eye, EyeOff, BookOpen, Users, BookMarked, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Feature({ icon: Icon, text, desc }: { icon: React.ElementType; text: string; desc: string }) {
  return (
    <div className="flex items-start gap-3.5">
      <div className="w-9 h-9 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-green-300" />
      </div>
      <div>
        <p className="text-white text-sm font-semibold leading-tight">{text}</p>
        <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function FloatingBook({ top, left, rotate, delay, opacity }: { top: string; left: string; rotate: string; delay: string; opacity: string }) {
  return (
    <div
      className="absolute w-10 h-14 rounded-lg border border-white/15 bg-white/8"
      style={{ top, left, transform: `rotate(${rotate})`, opacity, animation: `float 6s ease-in-out ${delay} infinite alternate` }}
    />
  );
}

export default function Login() {
  const { user, login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please enter both email and password."); return; }
    setSubmitting(true); setError("");
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes float {
          from { transform: translateY(0px) rotate(var(--r, 0deg)); }
          to   { transform: translateY(-12px) rotate(var(--r, 0deg)); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .badge-shimmer-green {
          background: linear-gradient(90deg, rgba(34,197,94,0.2) 0%, rgba(34,197,94,0.4) 50%, rgba(34,197,94,0.2) 100%);
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      <div className="min-h-screen flex bg-slate-950 overflow-y-auto">
        {/* ─── Left decorative panel ─── */}
        <div className="hidden lg:flex flex-col justify-between w-[440px] flex-shrink-0 relative overflow-hidden"
          style={{ background: "linear-gradient(160deg, #0e1e30 0%, #0a1220 55%, #060d1a 100%)" }}>

          <div className="absolute inset-0 sidebar-pattern pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-green-700/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 -left-16 w-72 h-72 rounded-full bg-violet-700/15 blur-3xl pointer-events-none" />

          <FloatingBook top="18%" left="72%" rotate="-12deg" delay="0s"   opacity="0.5" />
          <FloatingBook top="38%" left="80%" rotate="8deg"  delay="1.2s" opacity="0.35" />
          <FloatingBook top="62%" left="68%" rotate="-5deg" delay="0.6s" opacity="0.4" />

          <div className="relative p-10 flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-14">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-green-900/60"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                <Library className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-base tracking-tight leading-tight">LibraryOS</p>
                <p className="text-slate-400 text-xs font-medium">Staff Portal</p>
              </div>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 badge-shimmer-green border border-green-400/30 rounded-full px-3 py-1 mb-6 w-fit">
              <Sparkles className="w-3 h-3 text-green-300" />
              <span className="text-xs text-green-200 font-semibold tracking-wide">Management System</span>
            </div>

            {/* Headline */}
            <h2 className="text-[2.1rem] font-bold text-white leading-[1.15] mb-4 tracking-tight">
              Your complete<br />
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(90deg, #4ade80, #86efac)" }}>
                library at a glance
              </span>
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-10 max-w-xs">
              Manage books, members, loans, fines, and reservations from one powerful dashboard.
            </p>

            {/* Features */}
            <div className="space-y-5">
              <Feature icon={BookOpen}   text="Catalog & Book Management"       desc="Search, add, and track your entire collection" />
              <Feature icon={Users}      text="Member Records & Subscriptions"  desc="Member history, plans, and activity in one place" />
              <Feature icon={BookMarked} text="Loans, Reservations & Fines"     desc="Full lifecycle tracking with automated overdue alerts" />
            </div>

            {/* Footer */}
            <div className="mt-auto pt-10">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <p className="text-slate-500 text-xs font-medium">LibraryOS · Staff Portal</p>
                <div className="h-px flex-1 bg-white/10" />
              </div>
            </div>
          </div>
        </div>

        {/* ─── Right login panel ─── */}
        <div className="flex-1 flex items-start sm:items-center justify-center p-5 sm:p-6 pt-6"
          style={{ background: "linear-gradient(145deg, #111827 0%, #0f172a 100%)" }}>

          <div className="absolute w-[500px] h-[500px] rounded-full bg-green-900/15 blur-[100px] pointer-events-none" />

          <div className="relative w-full max-w-sm">
            {/* Mobile logo */}
            <div className="lg:hidden flex flex-col items-center mb-10">
              <div className="w-14 h-14 rounded-3xl flex items-center justify-center mb-3 shadow-xl shadow-green-900/50"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                <Library className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">LibraryOS</h1>
              <p className="text-slate-400 text-sm mt-0.5 font-medium">Staff Portal</p>
            </div>

            {/* Card */}
            <div className="bg-slate-800/60 border border-white/12 rounded-3xl p-6 sm:p-8 backdrop-blur-sm shadow-2xl shadow-black/40">
              {/* Heading */}
              <div className="mb-7">
                <h2 className="text-2xl font-bold text-white tracking-tight">Welcome back</h2>
                <p className="text-slate-300 text-sm mt-1.5">Sign in to your account to continue</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-500/15 border border-red-400/40 text-red-300 text-sm px-4 py-3 rounded-2xl flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0 animate-pulse" />
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                    Email address
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@library.com"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-900/70 border border-white/15 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400/60 transition-all duration-200 hover:border-white/25"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-12 rounded-2xl bg-slate-900/70 border border-white/15 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400/60 transition-all duration-200 hover:border-white/25"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 transition-colors rounded-lg"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full text-white font-bold py-3.5 rounded-2xl text-sm transition-all duration-200 shadow-lg shadow-green-900/50 mt-2 select-none active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                  style={{ background: submitting ? "#16a34a" : "linear-gradient(135deg, #22c55e, #16a34a)" }}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Signing in…
                    </span>
                  ) : "Sign in"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
