import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { Library, Eye, EyeOff, BookOpen, Users, BookMarked } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Feature({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-3 text-slate-400">
      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-indigo-400" />
      </div>
      <span className="text-sm">{text}</span>
    </div>
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
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 sidebar-bg p-10 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-indigo-600/10 blur-3xl" />
          <div className="absolute bottom-10 -left-20 w-64 h-64 rounded-full bg-indigo-500/5 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
              <Library className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">LibraryOS</span>
          </div>

          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            Your complete<br />library at a glance
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-10">
            Manage books, members, loans, fines, and reservations from one powerful dashboard.
          </p>

          <div className="space-y-3">
            <Feature icon={BookOpen} text="Catalog & book management" />
            <Feature icon={Users} text="Member records & subscriptions" />
            <Feature icon={BookMarked} text="Loans, reservations & fines" />
          </div>
        </div>

        {/* Footer */}
        <div className="relative">
          <p className="text-slate-600 text-xs">
            LibraryOS · Staff Portal
          </p>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 bg-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mb-3 shadow-lg shadow-indigo-900/50">
              <Library className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">LibraryOS</h1>
            <p className="text-slate-400 text-sm mt-1">Staff Portal</p>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-slate-400 text-sm mt-1">Sign in to your account to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Email address
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@library.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/8 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-800 border border-white/8 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-indigo-900/40 mt-2 select-none"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : "Sign in"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5">
            <p className="text-center text-xs text-slate-600">
              Default admin credentials
            </p>
            <div className="mt-2 bg-slate-800/60 rounded-xl px-4 py-2.5 text-center">
              <p className="text-xs text-slate-400 font-mono">
                admin@library.com <span className="text-slate-600 mx-1">/</span> admin123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
