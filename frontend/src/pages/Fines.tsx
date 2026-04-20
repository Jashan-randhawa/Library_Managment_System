import { useState, useEffect, useCallback } from "react";
import { IndianRupee, CheckCircle, XCircle, MinusCircle } from "lucide-react";
import {
  PageHeader, Card, Badge, Select, Table, Th, Td, TableFooter,
  Button, Empty, SkeletonRows, SearchBar,
} from "../components/ui";
import { finesApi } from "../lib/api";
import { formatDate, formatCurrency, useDebounce } from "../lib/utils";
import { useToast } from "../components/Toast";

interface Fine {
  _id: string;
  memberName: string;
  bookTitle: string;
  reason: string;
  amount: number;
  issuedDate: string;
  paidDate?: string;
  status: string;
}

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "unpaid", label: "Unpaid" },
  { value: "paid", label: "Paid" },
  { value: "waived", label: "Waived" },
];

const statusBadge: Record<string, "danger"|"success"|"neutral"> = {
  unpaid: "danger", paid: "success", waived: "neutral",
};

export default function Fines() {
  const { toast } = useToast();
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const debouncedSearch = useDebounce(search);

  const fetchFines = useCallback(async () => {
    setLoading(true);
    try {
      const data = await finesApi.getAll({ search: debouncedSearch, status });
      setFines(data as Fine[]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [debouncedSearch, status]);

  useEffect(() => { fetchFines(); }, [fetchFines]);

  const handlePay = async (id: string, memberName: string) => {
    try {
      await finesApi.pay(id);
      fetchFines();
      toast(`Fine for ${memberName} marked as paid`);
    } catch { toast("Failed to update fine", "error"); }
  };

  const handleWaive = async (id: string, memberName: string) => {
    try {
      await finesApi.waive(id);
      fetchFines();
      toast(`Fine for ${memberName} waived`);
    } catch { toast("Failed to waive fine", "error"); }
  };

  const totalUnpaid   = fines.filter(f => f.status === "unpaid").reduce((s, f) => s + f.amount, 0);
  const totalCollected = fines.filter(f => f.status === "paid").reduce((s, f) => s + f.amount, 0);
  const waived        = fines.filter(f => f.status === "waived").length;

  return (
    <div className="p-6 sm:p-8">
      <PageHeader title="Fines" subtitle="Manage overdue and damage fines" />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Outstanding",
            value: formatCurrency(totalUnpaid),
            sub: `${fines.filter(f => f.status === "unpaid").length} unpaid fines`,
            cls: "bg-red-50 text-red-500",
            icon: IndianRupee,
          },
          {
            label: "Collected",
            value: formatCurrency(totalCollected),
            sub: `${fines.filter(f => f.status === "paid").length} fines paid`,
            cls: "bg-emerald-50 text-emerald-500",
            icon: CheckCircle,
          },
          {
            label: "Waived",
            value: String(waived),
            sub: "fines forgiven",
            cls: "bg-slate-100 text-slate-500",
            icon: MinusCircle,
          },
        ].map(({ label, value, sub, cls, icon: Icon }) => (
          <Card key={label} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cls}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 tabular-nums">{value}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">{sub}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4 mb-5">
        <div className="flex gap-3 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by member or book…" />
          <Select value={status} onChange={setStatus} options={statusOptions} className="min-w-36" />
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Member</Th>
              <Th>Book</Th>
              <Th>Reason</Th>
              <Th>Amount</Th>
              <Th>Issued</Th>
              <Th>Paid On</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={6} cols={8} />
            ) : fines.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <Empty message="No fines found" hint="All clear — no outstanding fines" icon={CheckCircle} />
                </td>
              </tr>
            ) : fines.map((fine) => (
              <tr key={fine._id} className="hover:bg-slate-50/60 transition-colors">
                <Td>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-red-700 text-xs font-bold">{fine.memberName[0]}</span>
                    </div>
                    <span className="font-semibold text-slate-800 text-sm">{fine.memberName}</span>
                  </div>
                </Td>
                <Td>
                  <p className="text-slate-700 text-sm max-w-40 truncate">{fine.bookTitle}</p>
                </Td>
                <Td>
                  <span className="text-slate-500 text-xs capitalize">{fine.reason}</span>
                </Td>
                <Td>
                  <span className={`font-bold text-sm ${fine.status === "unpaid" ? "text-red-600" : "text-slate-500 line-through"}`}>
                    {formatCurrency(fine.amount)}
                  </span>
                </Td>
                <Td><span className="text-slate-500">{formatDate(fine.issuedDate)}</span></Td>
                <Td>
                  <span className="text-slate-500">
                    {fine.paidDate ? formatDate(fine.paidDate) : "—"}
                  </span>
                </Td>
                <Td>
                  <Badge variant={statusBadge[fine.status]} dot>{fine.status}</Badge>
                </Td>
                <Td>
                  {fine.status === "unpaid" && (
                    <div className="flex gap-1.5">
                      <Button
                        variant="ghost"
                        className="text-xs px-2.5 py-1.5 h-auto text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                        onClick={() => handlePay(fine._id, fine.memberName)}
                      >
                        <CheckCircle className="w-3 h-3" /> Paid
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-xs px-2.5 py-1.5 h-auto text-slate-500 hover:bg-slate-100"
                        onClick={() => handleWaive(fine._id, fine.memberName)}
                      >
                        <XCircle className="w-3 h-3" /> Waive
                      </Button>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {!loading && <TableFooter total={fines.length} />}
      </Card>
    </div>
  );
}
