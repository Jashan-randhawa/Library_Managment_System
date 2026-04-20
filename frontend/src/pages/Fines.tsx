import { useState, useEffect, useCallback } from "react";
import { Search, IndianRupee } from "lucide-react";
import { PageHeader, Card, Badge, Select, Table, Th, Td, TableFooter, Button, Empty, SkeletonRows } from "../components/ui";
import { finesApi } from "../lib/api";
import { formatDate, formatCurrency, useDebounce } from "../lib/utils";
import { useToast } from "../components/Toast";

interface Fine { _id: string; memberName: string; bookTitle: string; reason: string; amount: number; issuedDate: string; paidDate?: string; status: string; }
const statusOptions = [{ value: "", label: "All Status" },{ value: "unpaid", label: "Unpaid" },{ value: "paid", label: "Paid" },{ value: "waived", label: "Waived" }];
const statusBadge: Record<string, "danger"|"success"|"neutral"> = { unpaid: "danger", paid: "success", waived: "neutral" };

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
    } catch (e) {
      console.error(e);
      toast("Failed to update fine", "error");
    }
  };

  const handleWaive = async (id: string, memberName: string) => {
    try {
      await finesApi.waive(id);
      fetchFines();
      toast(`Fine for ${memberName} waived`);
    } catch (e) {
      console.error(e);
      toast("Failed to waive fine", "error");
    }
  };

  const totalUnpaid = fines.filter(f => f.status === "unpaid").reduce((s, f) => s + f.amount, 0);
  const totalCollected = fines.filter(f => f.status === "paid").reduce((s, f) => s + f.amount, 0);

  return (
    <div className="p-4 sm:p-8">
      <PageHeader title="Fines" subtitle="Manage overdue and damage fines" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[{ label: "unpaid fines total", value: formatCurrency(totalUnpaid), color: "text-red-500 bg-red-50", iconColor: "text-red-500" },
          { label: `${fines.filter(f => f.status === "paid").length} fines paid`, value: formatCurrency(totalCollected), color: "text-emerald-600 bg-emerald-50", iconColor: "text-emerald-500" },
          { label: "fines waived", value: String(fines.filter(f => f.status === "waived").length), color: "text-slate-600 bg-slate-100", iconColor: "text-slate-500" }]
          .map(({ label, value, color, iconColor }) => (
            <Card key={label} className="p-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}><IndianRupee className={`w-4 h-4 ${iconColor}`} /></div>
                <div><p className={`text-2xl font-bold ${color.split(" ")[0]}`}>{value}</p><p className="text-xs text-slate-500">{label}</p></div>
              </div>
            </Card>
          ))}
      </div>

      <Card className="p-4 mb-6">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input placeholder="Search by member or book..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
          </div>
          <Select value={status} onChange={setStatus} options={statusOptions} />
        </div>
      </Card>

      <Card>
        <Table>
          <thead><tr className="bg-slate-50/70"><Th>Member</Th><Th>Book</Th><Th>Reason</Th><Th>Amount</Th><Th>Issued</Th><Th>Paid On</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
          <tbody>
            {loading ? <SkeletonRows rows={5} cols={8} /> :
              fines.length === 0 ? (
                <tr><td colSpan={8}><Empty message="No fines found" hint="All clear — no outstanding fines" /></td></tr>
              ) : fines.map((fine) => (
                <tr key={fine._id} className="hover:bg-slate-50/50 transition-colors">
                  <Td><div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 text-xs font-bold">{fine.memberName[0]}</span>
                    </div><span className="font-medium">{fine.memberName}</span>
                  </div></Td>
                  <Td><p className="text-slate-700 max-w-36 truncate">{fine.bookTitle}</p></Td>
                  <Td><span className="text-slate-500 text-xs">{fine.reason}</span></Td>
                  <Td><span className={`font-semibold ${fine.status === "unpaid" ? "text-red-600" : "text-slate-600"}`}>{formatCurrency(fine.amount)}</span></Td>
                  <Td>{formatDate(fine.issuedDate)}</Td>
                  <Td>{fine.paidDate ? formatDate(fine.paidDate) : "—"}</Td>
                  <Td><Badge variant={statusBadge[fine.status]}>{fine.status}</Badge></Td>
                  <Td>{fine.status === "unpaid" && (
                    <div className="flex gap-1">
                      <Button variant="ghost" className="text-xs px-2 py-1 text-emerald-600" onClick={() => handlePay(fine._id, fine.memberName)}>Mark Paid</Button>
                      <Button variant="ghost" className="text-xs px-2 py-1 text-slate-500" onClick={() => handleWaive(fine._id, fine.memberName)}>Waive</Button>
                    </div>
                  )}</Td>
                </tr>
              ))
            }
          </tbody>
        </Table>
        {!loading && <TableFooter total={fines.length} />}
      </Card>
    </div>
  );
}
