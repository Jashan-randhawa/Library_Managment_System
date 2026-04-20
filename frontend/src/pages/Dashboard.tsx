import { useState, useEffect } from "react";
import { BookOpen, Users, BookMarked, AlertCircle, TrendingUp, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { StatCard, Card, PageHeader, Badge } from "../components/ui";
import { dashboardApi } from "../lib/api";
import { formatDate, formatCurrency } from "../lib/utils";

interface Stats { totalBooks: number; totalMembers: number; activeLoans: number; overdueLoans: number; totalFines: number; newMembersThisMonth: number; pendingReservations: number; }
interface Loan { _id: string; bookTitle: string; memberName: string; dueDate: string; status: string; }
interface Book { _id: string; title: string; availableCopies: number; }
interface MonthData { month: string; loans: number; }
interface GenreData { genre: string; count: number; }

export default function Dashboard() {
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

  if (loading) return <div className="p-8 text-slate-400 text-sm">Loading dashboard...</div>;

  return (
    <div className="p-8">
      <PageHeader title="Dashboard" subtitle={`Overview · ${new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Books" value={stats?.totalBooks ?? 0} icon={BookOpen} color="indigo" trend={{ value: "in catalog", positive: true }} />
        <StatCard title="Members" value={stats?.totalMembers ?? 0} icon={Users} color="emerald" trend={{ value: `${stats?.newMembersThisMonth ?? 0} new this month`, positive: true }} />
        <StatCard title="Active Loans" value={stats?.activeLoans ?? 0} icon={BookMarked} color="sky" />
        <StatCard title="Overdue" value={stats?.overdueLoans ?? 0} icon={AlertCircle} color="red" trend={{ value: "needs attention", positive: false }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div><p className="font-semibold text-slate-800 text-sm">Loans Over Time</p><p className="text-xs text-slate-400">Last 6 months</p></div>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={loansByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Line type="monotone" dataKey="loans" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: "#6366f1", strokeWidth: 0, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div><p className="font-semibold text-slate-800 text-sm">By Genre</p><p className="text-xs text-slate-400">Loan distribution</p></div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={genreData} layout="vertical" barSize={10}>
              <XAxis type="number" hide />
              <YAxis dataKey="genre" type="category" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={60} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Bar dataKey="count" fill="#818cf8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-slate-800 text-sm">Recent Loans</p>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-3">
            {recentLoans.map((loan) => (
              <div key={loan._id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 leading-tight">{loan.bookTitle}</p>
                    <p className="text-xs text-slate-400">{loan.memberName} · Due {formatDate(loan.dueDate)}</p>
                  </div>
                </div>
                <Badge variant={loan.status === "active" ? "info" : loan.status === "overdue" ? "danger" : "success"}>{loan.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <p className="font-semibold text-slate-800 text-sm mb-3">Outstanding Fines</p>
            <div className="text-center py-2">
              <p className="text-3xl font-bold text-red-500">{formatCurrency(stats?.totalFines ?? 0)}</p>
              <p className="text-xs text-slate-400 mt-1">unpaid fines total</p>
            </div>
          </Card>
          <Card className="p-5">
            <p className="font-semibold text-slate-800 text-sm mb-3">Low Stock</p>
            <div className="space-y-2">
              {lowStock.slice(0, 3).map((book) => (
                <div key={book._id} className="flex items-center justify-between">
                  <p className="text-xs text-slate-600 truncate flex-1 mr-2">{book.title}</p>
                  <Badge variant={book.availableCopies === 0 ? "danger" : "warning"}>
                    {book.availableCopies === 0 ? "Out" : `${book.availableCopies} left`}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
