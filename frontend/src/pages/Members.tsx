import { useState, useEffect, useCallback } from "react";
import { Plus, Users, UserCheck, UserX, Clock } from "lucide-react";
import {
  PageHeader, Card, Badge, Button, Input, Select,
  Table, Th, Td, TableFooter, Modal, Empty, SkeletonRows, Alert, SearchBar,
} from "../components/ui";
import { membersApi } from "../lib/api";
import { formatDate, formatCurrency, useDebounce } from "../lib/utils";
import { useToast } from "../components/Toast";

interface Member {
  _id: string;
  name: string;
  email: string;
  phone: string;
  membershipType: string;
  joinDate: string;
  status: string;
  loansCount: number;
  finesOwed: number;
}

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "expired", label: "Expired" },
];
const membershipOptions = [
  { value: "", label: "All Types" },
  { value: "standard", label: "Standard" },
  { value: "premium", label: "Premium" },
  { value: "student", label: "Student" },
];

const membershipBadge: Record<string, "default"|"success"|"neutral"> = {
  premium: "success", standard: "default", student: "neutral",
};
const statusBadge: Record<string, "success"|"danger"|"warning"> = {
  active: "success", suspended: "danger", expired: "warning",
};

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["bg-indigo-100 text-indigo-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700", "bg-sky-100 text-sky-700", "bg-purple-100 text-purple-700"];
  const colorCls = colors[name.charCodeAt(0) % colors.length];
  const sizeCls = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-xs";
  return (
    <div className={`${sizeCls} ${colorCls} rounded-full flex items-center justify-center flex-shrink-0 font-bold`}>
      {initials}
    </div>
  );
}

export default function Members() {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [membership, setMembership] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [newMember, setNewMember] = useState({
    name: "", email: "", phone: "", membershipType: "standard",
  });

  const debouncedSearch = useDebounce(search);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await membersApi.getAll({ search: debouncedSearch, status, membershipType: membership });
      setMembers(data as Member[]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [debouncedSearch, status, membership]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleAdd = async () => {
    if (!newMember.name || !newMember.email) { setError("Name and email are required."); return; }
    setSaving(true); setError("");
    try {
      await membersApi.create(newMember);
      setAddOpen(false);
      setNewMember({ name: "", email: "", phone: "", membershipType: "standard" });
      fetchMembers();
      toast(`${newMember.name} added as a member`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add member");
    } finally { setSaving(false); }
  };

  const active    = members.filter(m => m.status === "active").length;
  const suspended = members.filter(m => m.status === "suspended").length;
  const expired   = members.filter(m => m.status === "expired").length;

  return (
    <div className="p-6 sm:p-8">
      <PageHeader
        title="Members"
        subtitle={`${members.length} members registered`}
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" /> Add Member
          </Button>
        }
      />

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Active Members", value: active,    cls: "bg-emerald-50 text-emerald-600", icon: UserCheck },
          { label: "Suspended",      value: suspended, cls: "bg-red-50 text-red-600",         icon: UserX },
          { label: "Expired",        value: expired,   cls: "bg-amber-50 text-amber-600",     icon: Clock },
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
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email…" />
          <Select value={status} onChange={setStatus} options={statusOptions} className="min-w-36" />
          <Select value={membership} onChange={setMembership} options={membershipOptions} className="min-w-36" />
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Member</Th>
              <Th>Phone</Th>
              <Th>Membership</Th>
              <Th>Joined</Th>
              <Th>Loans</Th>
              <Th>Fines Owed</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={6} cols={7} />
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <Empty message="No members found" hint="Try adjusting your filters or add a new member" icon={Users} />
                </td>
              </tr>
            ) : members.map((m) => (
              <tr key={m._id} className="hover:bg-slate-50/60 transition-colors">
                <Td className="whitespace-normal">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} />
                    <div>
                      <p className="font-semibold text-slate-800 text-sm whitespace-nowrap">{m.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{m.email}</p>
                    </div>
                  </div>
                </Td>
                <Td><span className="text-slate-500 text-sm">{m.phone || "—"}</span></Td>
                <Td><Badge variant={membershipBadge[m.membershipType]} dot>{m.membershipType}</Badge></Td>
                <Td><span className="text-slate-500">{formatDate(m.joinDate)}</span></Td>
                <Td>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                    {m.loansCount}
                  </span>
                </Td>
                <Td>
                  {m.finesOwed > 0 ? (
                    <span className="text-red-600 font-semibold text-sm">{formatCurrency(m.finesOwed)}</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </Td>
                <Td><Badge variant={statusBadge[m.status]} dot>{m.status}</Badge></Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {!loading && <TableFooter total={members.length} />}
      </Card>

      {/* Add member modal */}
      <Modal
        open={addOpen}
        onClose={() => { setAddOpen(false); setError(""); }}
        title="Add New Member"
        subtitle="Register a new library member"
      >
        <div className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <Input label="Full Name *" placeholder="Jane Doe" value={newMember.name} onChange={(v) => setNewMember({ ...newMember, name: v })} />
          <Input label="Email *" type="email" placeholder="jane@email.com" value={newMember.email} onChange={(v) => setNewMember({ ...newMember, email: v })} />
          <Input label="Phone" placeholder="+91-XXXXX-XXXXX" value={newMember.phone} onChange={(v) => setNewMember({ ...newMember, phone: v })} />
          <Select
            label="Membership Type"
            value={newMember.membershipType}
            onChange={(v) => setNewMember({ ...newMember, membershipType: v })}
            options={[
              { value: "standard", label: "Standard" },
              { value: "premium", label: "Premium" },
              { value: "student", label: "Student" },
            ]}
          />
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleAdd} disabled={saving} className="flex-1">
              {saving ? "Adding…" : "Add Member"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
