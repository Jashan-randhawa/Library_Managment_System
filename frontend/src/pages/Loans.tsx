import { useState, useEffect, useCallback } from "react";
import { Search, BookMarked, CheckCircle, AlertTriangle } from "lucide-react";
import { PageHeader, Card, Badge, Button, Select, Table, Th, Td, Empty } from "../components/ui";
import { loansApi } from "../lib/api";
import { formatDate, getDaysOverdue } from "../lib/utils";

interface Loan { _id: string; bookTitle: string; memberName: string; issueDate: string; dueDate: string; returnDate?: string; status: string; }
const statusOptions = [{ value: "", label: "All Status" },{ value: "active", label: "Active" },{ value: "overdue", label: "Overdue" },{ value: "returned", label: "Returned" }];
const statusBadge: Record<string, "info"|"danger"|"success"> = { active: "info", overdue: "danger", returned: "success" };

export default function Loans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loansApi.getAll({ search, status });
      setLoans(data as Loan[]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [search, status]);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  const handleReturn = async (id: string) => {
    try {
      await loansApi.returnBook(id);
      fetchLoans();
    } catch (e) { console.error(e); }
  };

  const active = loans.filter(l => l.status === "active").length;
  const overdue = loans.filter(l => l.status === "overdue").length;
  const returned = loans.filter(l => l.status === "returned").length;

  return (
    <div className="p-8">
      <PageHeader title="Loans" subtitle={`${loans.length} total loans tracked`} />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[{ label: "Active Loans", value: active, icon: BookMarked, color: "text-sky-600 bg-sky-50" },
          { label: "Overdue", value: overdue, icon: AlertTriangle, color: "text-red-600 bg-red-50" },
          { label: "Returned", value: returned, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" }]
          .map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-4 h-4" /></div>
              <div><p className="text-2xl font-bold text-slate-800">{value}</p><p className="text-xs text-slate-500">{label}</p></div>
            </Card>
          ))}
      </div>

      <Card className="p-4 mb-6">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input placeholder="Search by book or member..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
          </div>
          <Select value={status} onChange={setStatus} options={statusOptions} />
        </div>
      </Card>

      <Card>
        {loading ? <div className="py-16 text-center text-slate-400 text-sm">Loading loans...</div> : (
          <Table>
            <thead><tr className="bg-slate-50/70"><Th>Book</Th><Th>Member</Th><Th>Issue Date</Th><Th>Due Date</Th><Th>Return Date</Th><Th>Status</Th><Th>Action</Th></tr></thead>
            <tbody>
              {loans.length === 0 ? <tr><td colSpan={7}><Empty message="No loans found" /></td></tr> :
                loans.map((loan) => {
                  const daysOverdue = getDaysOverdue(loan.dueDate);
                  return (
                    <tr key={loan._id} className="hover:bg-slate-50/50 transition-colors">
                      <Td><p className="font-medium text-slate-800">{loan.bookTitle}</p></Td>
                      <Td><div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-indigo-600 text-xs font-bold">{loan.memberName[0]}</span>
                        </div><span>{loan.memberName}</span>
                      </div></Td>
                      <Td>{formatDate(loan.issueDate)}</Td>
                      <Td><span className={loan.status === "overdue" ? "text-red-600 font-medium" : ""}>{formatDate(loan.dueDate)}</span></Td>
                      <Td>{loan.returnDate ? formatDate(loan.returnDate) : "—"}</Td>
                      <Td><div className="flex flex-col gap-0.5">
                        <Badge variant={statusBadge[loan.status]}>{loan.status}</Badge>
                        {loan.status === "overdue" && daysOverdue > 0 && <span className="text-xs text-red-500">{daysOverdue}d overdue</span>}
                      </div></Td>
                      <Td>{loan.status !== "returned" && (
                        <Button variant="ghost" className="text-xs px-2 py-1" onClick={() => handleReturn(loan._id)}>Mark Returned</Button>
                      )}</Td>
                    </tr>
                  );
                })
              }
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
