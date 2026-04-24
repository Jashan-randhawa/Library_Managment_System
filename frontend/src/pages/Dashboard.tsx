import { useState, useEffect } from "react";
import { BookOpen, Users, BookMarked, AlertCircle, TrendingUp, Clock, CalendarCheck, IndianRupee } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { StatCard, SkeletonStatCard, Skeleton, Card, Badge } from "../components/ui";
import { dashboardApi } from "../lib/api";
import { formatDate, formatCurrency } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

interface Stats {
  totalBooks: number; totalMembers: number; activeLoans: number;
  overdueLoans: number; totalFines: number; newMembersThisMonth: number; pendingReservations: number;
}
interface Loan { _id: string; bookTitle: string; memberName: string; dueDate: string; status: string; }
interface Book { _id: string; title: string; availableCopies: number; }
interface MonthData { month: string; loans: number; }
interface GenreData { genre: string; count: number; }

const GENRE_COLORS = ["#22c55e","#16a34a","#4ade80","#86efac","#bbf7d0","#dcfce7"];

function DashboardSkeleton() {
  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8">
        <Skeleton className="h-7 w-52 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[0,1,2,3].map(i => <SkeletonStatCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <Skeleton className="h-4 w-36 mb-1" /><Skeleton className="h-3 w-24 mb-5" /><Skeleton className="h-48 w-full rounded-xl" />
        </Card>
        <Card className="p-6">
          <Skeleton className="h-4 w-28 mb-1" /><Skeleton className="h-3 w-20 mb-5" /><Skeleton className="h-48 w-full rounded-xl" />
        </Card>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip text-xs rounded-xl px-3 py-2 shadow-xl">
      <p className="font-semibold mb-0.5 opacity-70">{label}</p>
      <p className="text-green-400 font-bold">{payload[0].value} issues</p>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentLoans, setRecentLoans] = useState<Loan[]>([]);
  const [lowStock, setLowStock] = useState<Book[]>([]);
  const [loansByMonth, setLoansByMonth] = useState<MonthData[]>([]);
  const [genreData, setGenreData] = useState<GenreData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardApi.getStats(),
      dashboardApi.getRecentLoans(),
      dashboardApi.getLowStock(),
      dashboardApi.getLoansByMonth(),
      dashboardApi.getLoansByGenre(),
    ]).then(([s, loans, stock, byMonth, byGenre]) => {
      setStats(s as Stats);
      setRecentLoans(loans as Loan[]);
      setLowStock(stock as Book[]);
      setLoansByMonth(byMonth as MonthData[]);
      setGenreData(byGenre as GenreData[]);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-theme-primary tracking-tight">
              {getGreeting()}, {firstName} 👋
            </h1>
            <p className="text-green-500 dark:text-green-400 text-sm mt-1 font-medium truncate">
              <span className="hidden sm:inline">{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
              <span className="sm:hidden">{new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
            </p>
          </div>
          {(stats?.overdueLoans ?? 0) > 0 && (
            <div className="flex items-center gap-2 badge-red border border-red-200/50 dark:border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold px-3 py-2 rounded-xl flex-shrink-0">
              <AlertCircle className="w-3.5 h-3.5" />
              {stats?.overdueLoans} overdue
            </div>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard title="Total Books" value={stats?.totalBooks ?? 0} icon={BookOpen} color="emerald" subtitle="in catalog" />
        <StatCard title="Members" value={stats?.totalMembers ?? 0} icon={Users} color="sky" trend={{ value: `${stats?.newMembersThisMonth ?? 0} new this month`, positive: true }} />
        <StatCard title="Active Issues" value={stats?.activeLoans ?? 0} icon={BookMarked} color="indigo" subtitle={`${stats?.pendingReservations ?? 0} pending reservations`} />
        <StatCard title="Overdue" value={stats?.overdueLoans ?? 0} icon={AlertCircle} color="red"
          trend={stats?.overdueLoans ? { value: "needs attention", positive: false } : undefined}
          subtitle={!stats?.overdueLoans ? "all clear" : undefined} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Line chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-bold text-theme-primary text-base">Issues Over Time</p>
              <p className="text-xs text-theme-secondary mt-0.5 font-medium">Last 6 months activity</p>
            </div>
            <div className="flex items-center gap-2 badge-emerald border border-emerald-200/50 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-xl">
              <TrendingUp className="w-3.5 h-3.5" />
              Trend
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={loansByMonth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="loanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-divider)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-tertiary)", fontWeight: 500 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#22c55e", strokeWidth: 1, strokeDasharray: "4 4" }} />
              <Area type="monotone" dataKey="loans" stroke="#22c55e" strokeWidth={2.5} fill="url(#loanGrad)"
                dot={{ fill: "#22c55e", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: "#16a34a", stroke: "white", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Donut chart */}
        <Card className="p-6">
          <div className="mb-4">
            <p className="font-bold text-theme-primary text-base">By Genre</p>
            <p className="text-xs text-theme-secondary mt-0.5 font-medium">Issue distribution</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={genreData} dataKey="count" nameKey="genre" cx="40%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3}>
                {genreData.map((_, i) => (
                  <Cell key={i} fill={GENRE_COLORS[i % GENRE_COLORS.length]} />
                ))}
              </Pie>
              <Legend
                layout="vertical" align="right" verticalAlign="middle"
                iconType="circle" iconSize={8}
                formatter={(value, entry: { payload?: { count?: number } }) => (
                  <span style={{ color: "var(--text-secondary)", fontSize: 11, fontWeight: 600 }}>
                    {value} <span style={{ color: "var(--text-tertiary)" }}>{entry?.payload?.count ?? 0}%</span>
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent loans */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between px-6 py-4 border-b border-theme-divider">
            <div>
              <p className="font-bold text-theme-primary text-base">Recent Issues</p>
              <p className="text-xs text-theme-secondary mt-0.5 font-medium">Latest activity</p>
            </div>
            <Clock className="w-4 h-4 text-theme-tertiary" />
          </div>
          <div className="divide-y divide-[var(--border-divider)]">
            {recentLoans.length === 0 ? (
              <div className="py-12 text-center">
                <BookMarked className="w-8 h-8 text-theme-tertiary mx-auto mb-2" />
                <p className="text-theme-secondary text-sm">No recent issues</p>
              </div>
            ) : recentLoans.map((loan) => (
              <div key={loan._id} className="flex items-center justify-between px-6 py-3.5 theme-row-hover transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl icon-bg-emerald flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-theme-primary leading-tight truncate">{loan.bookTitle}</p>
                    <p className="text-xs text-theme-secondary mt-0.5 font-medium">{loan.memberName} · Due {formatDate(loan.dueDate)}</p>
                  </div>
                </div>
                <Badge variant={loan.status === "active" ? "info" : loan.status === "overdue" ? "danger" : "success"} dot>
                  {loan.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Right column */}
        <div className="space-y-5">
          {/* Fines summary */}
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl icon-bg-red flex items-center justify-center">
                <IndianRupee className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="font-bold text-theme-primary text-base">Outstanding Fines</p>
                <p className="text-xs text-theme-secondary font-medium">Unpaid balance</p>
              </div>
            </div>
            <p className="text-4xl font-bold text-red-500 tabular-nums">{formatCurrency(stats?.totalFines ?? 0)}</p>
            {(stats?.totalFines ?? 0) === 0 && (
              <p className="text-xs text-emerald-500 font-semibold mt-1.5 flex items-center gap-1">
                <span>✓</span> All fines cleared. Great!
              </p>
            )}
          </Card>

          {/* Low stock */}
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl icon-bg-amber flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="font-bold text-theme-primary text-base">Low Stock</p>
                <p className="text-xs text-theme-secondary font-medium">Needs restocking</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {lowStock.length === 0 ? (
                <p className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                  <span>✓</span> All books well stocked
                </p>
              ) : lowStock.slice(0, 4).map((book) => (
                <div key={book._id} className="flex items-center justify-between gap-2">
                  <p className="text-sm text-theme-primary truncate flex-1 font-semibold">{book.title}</p>
                  <Badge variant={book.availableCopies === 0 ? "danger" : "warning"} dot>
                    {book.availableCopies === 0 ? "Out" : `${book.availableCopies} left`}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Reservations quick stat */}
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl icon-bg-indigo flex items-center justify-center">
                <CalendarCheck className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-theme-primary tabular-nums leading-none">{stats?.pendingReservations ?? 0}</p>
                <p className="text-xs text-theme-secondary font-semibold mt-1.5">Pending reservations</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
