import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BookMarked,
  CalendarCheck,
  AlertCircle,
  Library,
  Menu,
  X,
  LogOut,
  UserCog,
  ChevronRight,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

const baseNavItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/books", icon: BookOpen, label: "Books" },
  { to: "/members", icon: Users, label: "Members" },
  { to: "/loans", icon: BookMarked, label: "Loans" },
  { to: "/reservations", icon: CalendarCheck, label: "Reservations" },
  { to: "/fines", icon: AlertCircle, label: "Fines" },
];

const adminNavItem = { to: "/users", icon: UserCog, label: "Staff Users" };

function Sidebar({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();

  const navItems = isAdmin ? [...baseNavItems, adminNavItem] : baseNavItems;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div className="w-64 flex-shrink-0 sidebar-bg flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-900/40">
            <Library className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight tracking-tight">LibraryOS</p>
            <p className="text-slate-500 text-xs">Management System</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-white/5 mb-4" />

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.12em] px-3 mb-3">Navigation</p>
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative",
                isActive
                  ? "bg-indigo-600/90 text-white shadow-lg shadow-indigo-900/30"
                  : "text-slate-400 hover:text-white hover:bg-white/8"
              )}
              style={!isActive ? undefined : undefined}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r-full -ml-3" />
              )}
              <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300")} />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
            </NavLink>
          );
        })}

        {isAdmin && (
          <div className="pt-3">
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.12em] px-3 mb-3">Admin</p>
          </div>
        )}
      </nav>

      {/* User Footer */}
      <div className="mx-5 border-t border-white/5 mb-4" />
      <div className="px-3 pb-5">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-300 text-xs font-semibold truncate">{user?.name || "—"}</p>
            <p className="text-slate-600 text-xs truncate capitalize">{user?.role || ""}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="text-slate-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
          >
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

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 flex z-50">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 sidebar-bg border-b border-white/5">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Library className="w-4 h-4 text-white" />
            </div>
            <p className="text-white font-bold text-sm tracking-tight">LibraryOS</p>
          </div>
          <p className="text-slate-400 text-xs font-medium">{user?.name}</p>
        </div>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
