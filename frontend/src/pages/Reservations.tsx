import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { PageHeader, Card, Badge, Select, Table, Th, Td, TableFooter, Button, Empty, SkeletonRows } from "../components/ui";
import { reservationsApi } from "../lib/api";
import { formatDate, useDebounce } from "../lib/utils";
import { useToast } from "../components/Toast";

interface Reservation { _id: string; bookTitle: string; memberName: string; reservationDate: string; expiryDate: string; status: string; queuePosition: number; }
const statusOptions = [{ value: "", label: "All Status" },{ value: "pending", label: "Pending" },{ value: "fulfilled", label: "Fulfilled" },{ value: "cancelled", label: "Cancelled" },{ value: "expired", label: "Expired" }];
const statusBadge: Record<string, "warning"|"success"|"danger"|"neutral"> = { pending: "warning", fulfilled: "success", cancelled: "danger", expired: "neutral" };

export default function Reservations() {
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const debouncedSearch = useDebounce(search);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reservationsApi.getAll({ search: debouncedSearch, status });
      setReservations(data as Reservation[]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [debouncedSearch, status]);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);

  const handleFulfill = async (id: string, bookTitle: string) => {
    try {
      await reservationsApi.fulfill(id);
      fetchReservations();
      toast(`Reservation for "${bookTitle}" fulfilled`);
    } catch (e) {
      console.error(e);
      toast("Failed to fulfill reservation", "error");
    }
  };

  const handleCancel = async (id: string, bookTitle: string) => {
    try {
      await reservationsApi.cancel(id);
      fetchReservations();
      toast(`Reservation for "${bookTitle}" cancelled`);
    } catch (e) {
      console.error(e);
      toast("Failed to cancel reservation", "error");
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <PageHeader title="Reservations" subtitle={`${reservations.filter(r => r.status === "pending").length} pending reservations`} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {["pending","fulfilled","cancelled","expired"].map(s => (
          <Card key={s} className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{reservations.filter(r => r.status === s).length}</p>
            <p className="text-xs text-slate-500 capitalize mt-0.5">{s}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4 mb-6">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input placeholder="Search reservations..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
          </div>
          <Select value={status} onChange={setStatus} options={statusOptions} />
        </div>
      </Card>

      <Card>
        <Table>
          <thead><tr className="bg-slate-50/70"><Th>#</Th><Th>Book</Th><Th>Member</Th><Th>Reserved On</Th><Th>Expires</Th><Th>Queue</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
          <tbody>
            {loading ? <SkeletonRows rows={5} cols={8} /> :
              reservations.length === 0 ? (
                <tr><td colSpan={8}><Empty message="No reservations found" hint="Try adjusting your filters" /></td></tr>
              ) : reservations.map((res) => (
                <tr key={res._id} className="hover:bg-slate-50/50 transition-colors">
                  <Td><span className="text-slate-400 font-mono text-xs">#{res._id.slice(-4)}</span></Td>
                  <Td><p className="font-medium text-slate-800">{res.bookTitle}</p></Td>
                  <Td><div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-600 text-xs font-bold">{res.memberName[0]}</span>
                    </div><span>{res.memberName}</span>
                  </div></Td>
                  <Td>{formatDate(res.reservationDate)}</Td>
                  <Td>{formatDate(res.expiryDate)}</Td>
                  <Td><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">{res.queuePosition}</span></Td>
                  <Td><Badge variant={statusBadge[res.status]}>{res.status}</Badge></Td>
                  <Td>{res.status === "pending" && (
                    <div className="flex gap-1">
                      <Button variant="ghost" className="text-xs px-2 py-1 text-emerald-600" onClick={() => handleFulfill(res._id, res.bookTitle)}>Fulfill</Button>
                      <Button variant="ghost" className="text-xs px-2 py-1 text-red-500" onClick={() => handleCancel(res._id, res.bookTitle)}>Cancel</Button>
                    </div>
                  )}</Td>
                </tr>
              ))
            }
          </tbody>
        </Table>
        {!loading && <TableFooter total={reservations.length} />}
      </Card>
    </div>
  );
}
