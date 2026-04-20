import { useState, useEffect, useCallback } from "react";
import { CalendarCheck, CheckCircle, XCircle, Clock, Calendar } from "lucide-react";
import {
  PageHeader, Card, Badge, Select, Table, Th, Td, TableFooter,
  Button, Empty, SkeletonRows, SearchBar,
} from "../components/ui";
import { reservationsApi } from "../lib/api";
import { formatDate, useDebounce } from "../lib/utils";
import { useToast } from "../components/Toast";

interface Reservation {
  _id: string;
  bookTitle: string;
  memberName: string;
  reservationDate: string;
  expiryDate: string;
  status: string;
  queuePosition: number;
}

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
];

const statusBadge: Record<string, "warning"|"success"|"danger"|"neutral"> = {
  pending: "warning", fulfilled: "success", cancelled: "danger", expired: "neutral",
};

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
    } catch { toast("Failed to fulfill reservation", "error"); }
  };

  const handleCancel = async (id: string, bookTitle: string) => {
    try {
      await reservationsApi.cancel(id);
      fetchReservations();
      toast(`Reservation for "${bookTitle}" cancelled`);
    } catch { toast("Failed to cancel reservation", "error"); }
  };

  const counts = {
    pending:   reservations.filter(r => r.status === "pending").length,
    fulfilled: reservations.filter(r => r.status === "fulfilled").length,
    cancelled: reservations.filter(r => r.status === "cancelled").length,
    expired:   reservations.filter(r => r.status === "expired").length,
  };

  return (
    <div className="p-6 sm:p-8">
      <PageHeader
        title="Reservations"
        subtitle={`${counts.pending} pending reservation${counts.pending !== 1 ? "s" : ""}`}
      />

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Pending",   value: counts.pending,   icon: Clock,         cls: "bg-amber-50 text-amber-600" },
          { label: "Fulfilled", value: counts.fulfilled, icon: CheckCircle,   cls: "bg-emerald-50 text-emerald-600" },
          { label: "Cancelled", value: counts.cancelled, icon: XCircle,       cls: "bg-red-50 text-red-600" },
          { label: "Expired",   value: counts.expired,   icon: Calendar,      cls: "bg-slate-100 text-slate-500" },
        ].map(({ label, value, icon: Icon, cls }) => (
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
          <SearchBar value={search} onChange={setSearch} placeholder="Search reservations…" />
          <Select value={status} onChange={setStatus} options={statusOptions} className="min-w-36" />
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Book</Th>
              <Th>Member</Th>
              <Th>Reserved On</Th>
              <Th>Expires</Th>
              <Th>Queue</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={6} cols={8} />
            ) : reservations.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <Empty message="No reservations found" hint="Try adjusting your filters" icon={CalendarCheck} />
                </td>
              </tr>
            ) : reservations.map((res) => (
              <tr key={res._id} className="hover:bg-slate-50/60 transition-colors">
                <Td>
                  <span className="text-slate-400 font-mono text-xs">#{res._id.slice(-4)}</span>
                </Td>
                <Td>
                  <p className="font-semibold text-slate-800 text-sm">{res.bookTitle}</p>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-700 text-xs font-bold">{res.memberName[0]}</span>
                    </div>
                    <span className="text-sm text-slate-700">{res.memberName}</span>
                  </div>
                </Td>
                <Td><span className="text-slate-500">{formatDate(res.reservationDate)}</span></Td>
                <Td><span className="text-slate-500">{formatDate(res.expiryDate)}</span></Td>
                <Td>
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                    {res.queuePosition}
                  </span>
                </Td>
                <Td>
                  <Badge variant={statusBadge[res.status]} dot>{res.status}</Badge>
                </Td>
                <Td>
                  {res.status === "pending" && (
                    <div className="flex gap-1.5">
                      <Button
                        variant="ghost"
                        className="text-xs px-2.5 py-1.5 h-auto text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                        onClick={() => handleFulfill(res._id, res.bookTitle)}
                      >
                        <CheckCircle className="w-3 h-3" /> Fulfill
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-xs px-2.5 py-1.5 h-auto text-red-500 hover:bg-red-50"
                        onClick={() => handleCancel(res._id, res.bookTitle)}
                      >
                        <XCircle className="w-3 h-3" /> Cancel
                      </Button>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {!loading && <TableFooter total={reservations.length} />}
      </Card>
    </div>
  );
}
