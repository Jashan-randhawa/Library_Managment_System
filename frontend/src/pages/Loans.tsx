import { useState, useEffect, useCallback } from "react";
import { BookMarked, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import {
  PageHeader, Card, Badge, Button, Select,
  Table, Th, Td, TableFooter, Empty, SkeletonRows, SearchBar,
} from "../components/ui";
import { loansApi } from "../lib/api";
import { formatDate, getDaysOverdue, useDebounce, cn } from "../lib/utils";
import { useToast } from "../components/Toast";

interface Loan {
  _id: string;
  bookTitle: string;
  memberName: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: string;
}

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "overdue", label: "Overdue" },
  { value: "returned", label: "Returned" },
];

const statusBadge: Record<string, "info"|"danger"|"success"> = {
  active: "info", overdue: "danger", returned: "success",
};

function MemberInitial({ name }: { name: string }) {
  return (
    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
      <span className="text-indigo-700 text-xs font-bold">{name[0]?.toUpperCase()}</span>
    </div>
  );
}

export default function Loans() {
  const { toast } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const debouncedSearch = useDebounce(search);

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loansApi.getAll({ search: debouncedSearch, status });
      setLoans(data as Loan[]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [debouncedSearch, status]);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  const handleReturn = async (id: string, bookTitle: string) => {
    setReturningId(id);
    try {
      await loansApi.returnBook(id);
      fetchLoans();
      toast(`"${bookTitle}" marked as returned`);
    } catch (e) {
      console.error(e);
      toast("Failed to update loan", "error");
    } finally { setReturningId(null); }
  };

  const active   = loans.filter(l => l.status === "active").length;
  const overdue  = loans.filter(l => l.status === "overdue").length;
  const returned = loans.filter(l => l.status === "returned").length;

  return (
    <div className="p-6 sm:p-8">
      <PageHeader title="Loans" subtitle={`${loans.length} total loans tracked`} />

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Active Loans", value: active,   cls: "bg-sky-50 text-sky-600",         icon: BookMarked },
          { label: "Overdue",      value: overdue,  cls: "bg-red-50 text-red-600",          icon: AlertTriangle },
          { label: "Returned",     value: returned, cls: "bg-emerald-50 text-emerald-600",  icon: CheckCircle },
        ].map(({ label, value, cls, icon: Icon }) => (
          <Card key={label} className="p-4 flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${cls}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800 leading-none">{value}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4 mb-5">
        <div className="flex gap-3 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by book or member…" />
          <Select value={status} onChange={setStatus} options={statusOptions} className="min-w-36" />
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Book</Th>
              <Th>Member</Th>
              <Th>Issued</Th>
              <Th>Due Date</Th>
              <Th>Returned</Th>
              <Th>Status</Th>
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={6} cols={7} />
            ) : loans.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <Empty message="No loans found" hint="Try adjusting the status filter" icon={BookMarked} />
                </td>
              </tr>
            ) : loans.map((loan) => {
              const daysOverdue = getDaysOverdue(loan.dueDate);
              const isOverdue = loan.status === "overdue";
              return (
                <tr key={loan._id} className={cn(
                  "transition-colors",
                  isOverdue ? "bg-red-50/50 hover:bg-red-50/80" : "hover:bg-slate-50/60"
                )}>
                  <Td className="whitespace-normal">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-1.5 h-8 rounded-full flex-shrink-0",
                        isOverdue ? "bg-red-400" : loan.status === "returned" ? "bg-emerald-400" : "bg-sky-400"
                      )} />
                      <p className="font-semibold text-slate-800 text-sm whitespace-nowrap">{loan.bookTitle}</p>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <MemberInitial name={loan.memberName} />
                      <span className="text-sm text-slate-700">{loan.memberName}</span>
                    </div>
                  </Td>
                  <Td><span className="text-slate-500">{formatDate(loan.issueDate)}</span></Td>
                  <Td>
                    <span className={cn("font-medium text-sm", isOverdue ? "text-red-600" : "text-slate-700")}>
                      {formatDate(loan.dueDate)}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-slate-500">
                      {loan.returnDate ? formatDate(loan.returnDate) : "—"}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex flex-col gap-1">
                      <Badge variant={statusBadge[loan.status]} dot>{loan.status}</Badge>
                      {isOverdue && daysOverdue > 0 && (
                        <span className="text-xs text-red-500 font-semibold">{daysOverdue}d overdue</span>
                      )}
                    </div>
                  </Td>
                  <Td>
                    {loan.status !== "returned" && (
                      <Button
                        variant="outline"
                        className="text-xs px-3 py-1.5 h-auto"
                        disabled={returningId === loan._id}
                        onClick={() => handleReturn(loan._id, loan.bookTitle)}
                      >
                        {returningId === loan._id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : "Return"}
                      </Button>
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        {!loading && <TableFooter total={loans.length} />}
      </Card>
    </div>
  );
}
