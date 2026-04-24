import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, Users, BookMarked, CalendarCheck,
  AlertCircle, Library, Menu, X, LogOut, UserCog, ChevronRight, Sun, Moon,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const baseNavItems = [
  { to: "/",             icon: LayoutDashboard, label: "Dashboard" },
  { to: "/books",        icon: BookOpen,        label: "Books" },
  { to: "/members",      icon: Users,           label: "Members" },
  { to: "/loans",        icon: BookMarked,      label: "Issue Book" },
  { to: "/reservations", icon: CalendarCheck,   label: "Reservations" },
  { to: "/fines",        icon: AlertCircle,     label: "Fines" },
];
const adminNavItem = { to: "/users", icon: UserCog, label: "Staff Users" };

function NavItem({ to, icon: Icon, label, onClick }: { to: string; icon: React.ElementType; label: string; onClick?: () => void; }) {
  const location = useLocation();
  const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative",
        isActive ? "text-white nav-active-glow" : "text-slate-300 hover:text-white hover:bg-white/8"
      )}
      style={isActive ? { background: "linear-gradient(135deg, rgba(34,197,94,0.85), rgba(16,185,129,0.8))" } : undefined}
    >
      {isActive && <span className="absolute inset-y-0 left-0 w-0.5 rounded-r-full bg-green-300/60 -ml-3" />}
      <Icon className={cn("w-4 h-4 flex-shrink-0 transition-colors", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200")} />
      <span className="flex-1 tracking-[0.01em]">{label}</span>
      {isActive ? (
        <span className="w-1.5 h-1.5 rounded-full bg-white/50 flex-shrink-0" />
      ) : (
        <ChevronRight className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      )}
    </NavLink>
  );
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navItems = isAdmin ? [...baseNavItems, adminNavItem] : baseNavItems;
  const handleLogout = () => { logout(); navigate("/login"); };
  const initials = user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div className="w-72 flex-shrink-0 sidebar-bg flex flex-col h-full relative overflow-hidden">
      <div className="absolute inset-0 sidebar-pattern pointer-events-none opacity-60" />
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-green-600/10 blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="relative px-5 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
            <Library className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight tracking-tight">
              <span className="text-white">Library</span><span className="text-green-400">OS</span>
            </p>
            <p className="text-slate-400 text-[11px] font-medium">Management System</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 text-slate-400 hover:text-white hover:bg-white/10"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {onClose && (
            <button onClick={onClose} className="text-slate-500 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors lg:hidden" aria-label="Close menu">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="relative mx-5 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent mb-4" />

      <nav className="relative flex-1 px-3 overflow-y-auto pb-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em] px-3 mb-2">Navigation</p>
        <div className="space-y-0.5">
          {navItems.slice(0, 6).map(({ to, icon, label }) => (
            <NavItem key={to} to={to} icon={icon} label={label} onClick={onClose} />
          ))}
        </div>
        {isAdmin && (
          <>
            <div className="my-4 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em] px-3 mb-2">Admin</p>
            <NavItem to={adminNavItem.to} icon={adminNavItem.icon} label={adminNavItem.label} onClick={onClose} />
          </>
        )}
      </nav>

      <div className="relative mx-5 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

      <div className="relative px-3 py-4">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/6 transition-colors group">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-200 text-xs font-semibold truncate leading-tight">{user?.name || "—"}</p>
            <p className="text-slate-400 text-[11px] truncate capitalize font-medium">{user?.role || ""}</p>
          </div>
          <button onClick={handleLogout} title="Sign out"
            className="text-slate-400 hover:text-red-400 p-2 rounded-xl hover:bg-white/10 transition-all flex-shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (mobileOpen) { document.body.style.overflow = "hidden"; }
    else { document.body.style.overflow = ""; }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    let startX = 0;
    const handleTouchStart = (e: TouchEvent) => { startX = e.touches[0].clientX; };
    const handleTouchEnd = (e: TouchEvent) => { if (startX - e.changedTouches[0].clientX > 60) setMobileOpen(false); };
    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchend", handleTouchEnd);
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [mobileOpen]);

  return (
    <div className="flex h-screen overflow-hidden app-bg">
      <aside className="hidden lg:flex flex-shrink-0"><Sidebar /></aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setMobileOpen(false)} />
          <aside ref={drawerRef} className="absolute left-0 top-0 bottom-0 flex z-50 shadow-2xl" style={{ animation: "slideInLeft 0.22s ease-out" }}>
            <Sidebar onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3.5 sidebar-bg border-b border-white/5 relative flex-shrink-0">
          <div className="absolute inset-0 sidebar-pattern opacity-40 pointer-events-none" />
          <button onClick={() => setMobileOpen(true)} className="relative text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center" aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
          <div className="relative flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
              <Library className="w-4 h-4 text-white" />
            </div>
            <p className="text-white font-bold text-sm tracking-tight">LibraryOS</p>
          </div>
          <p className="relative text-slate-400 text-xs font-medium truncate max-w-24">{user?.name}</p>
        </div>

        <main className="flex-1 overflow-auto page-enter">{children}</main>
      </div>
    </div>
  );
}
