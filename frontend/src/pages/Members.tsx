import { useState, useEffect, useCallback } from "react";
import { Plus, Search, User } from "lucide-react";
import { PageHeader, Card, Badge, Button, Input, Select, Table, Th, Td, Modal, Empty } from "../components/ui";
import { membersApi } from "../lib/api";
import { formatDate, formatCurrency } from "../lib/utils";

interface Member { _id: string; name: string; email: string; phone: string; membershipType: string; joinDate: string; status: string; loansCount: number; finesOwed: number; }

const statusOptions = [{ value: "", label: "All Status" },{ value: "active", label: "Active" },{ value: "suspended", label: "Suspended" },{ value: "expired", label: "Expired" }];
const membershipOptions = [{ value: "", label: "All Types" },{ value: "standard", label: "Standard" },{ value: "premium", label: "Premium" },{ value: "student", label: "Student" }];
const membershipBadge: Record<string, "default"|"success"|"neutral"> = { premium: "success", standard: "default", student: "neutral" };
const statusBadge: Record<string, "success"|"danger"|"warning"> = { active: "success", suspended: "danger", expired: "warning" };

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [membership, setMembership] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [newMember, setNewMember] = useState({ name: "", email: "", phone: "", membershipType: "standard" });

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await membersApi.getAll({ search, status, membershipType: membership });
      setMembers(data as Member[]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [search, status, membership]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleAdd = async () => {
    if (!newMember.name || !newMember.email) return;
    setSaving(true); setError("");
    try {
      await membersApi.create(newMember);
      setAddOpen(false);
      setNewMember({ name: "", email: "", phone: "", membershipType: "standard" });
      fetchMembers();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to add member"); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-8">
      <PageHeader title="Members" subtitle={`${members.length} members registered`}
        action={<Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4" /> Add Member</Button>} />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[{ label: "Active", key: "active", color: "text-emerald-600 bg-emerald-50" },{ label: "Suspended", key: "suspended", color: "text-red-600 bg-red-50" },{ label: "Expired", key: "expired", color: "text-amber-600 bg-amber-50" }]
          .map(({ label, key, color }) => (
            <Card key={key} className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}><User className="w-4 h-4" /></div>
              <div><p className="text-2xl font-bold text-slate-800">{members.filter(m => m.status === key).length}</p><p className="text-xs text-slate-500">{label} Members</p></div>
            </Card>
          ))}
      </div>

      <Card className="p-4 mb-6">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
          </div>
          <Select value={status} onChange={setStatus} options={statusOptions} />
          <Select value={membership} onChange={setMembership} options={membershipOptions} />
        </div>
      </Card>

      <Card>
        {loading ? <div className="py-16 text-center text-slate-400 text-sm">Loading members...</div> : (
          <Table>
            <thead><tr className="bg-slate-50/70"><Th>Member</Th><Th>Phone</Th><Th>Membership</Th><Th>Joined</Th><Th>Loans</Th><Th>Fines Owed</Th><Th>Status</Th></tr></thead>
            <tbody>
              {members.length === 0 ? <tr><td colSpan={7}><Empty message="No members found" /></td></tr> :
                members.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50/50 transition-colors">
                    <Td><div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 text-xs font-bold">{m.name.split(" ").map(n => n[0]).join("").slice(0,2)}</span>
                      </div>
                      <div><p className="font-medium text-slate-800">{m.name}</p><p className="text-xs text-slate-400">{m.email}</p></div>
                    </div></Td>
                    <Td>{m.phone}</Td>
                    <Td><Badge variant={membershipBadge[m.membershipType]}>{m.membershipType}</Badge></Td>
                    <Td>{formatDate(m.joinDate)}</Td>
                    <Td>{m.loansCount}</Td>
                    <Td>{m.finesOwed > 0 ? <span className="text-red-600 font-medium">{formatCurrency(m.finesOwed)}</span> : <span className="text-slate-400">—</span>}</Td>
                    <Td><Badge variant={statusBadge[m.status]}>{m.status}</Badge></Td>
                  </tr>
                ))
              }
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={addOpen} onClose={() => { setAddOpen(false); setError(""); }} title="Add New Member">
        <div className="space-y-3">
          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <Input label="Full Name *" placeholder="John Doe" value={newMember.name} onChange={(v) => setNewMember({ ...newMember, name: v })} />
          <Input label="Email *" type="email" placeholder="john@email.com" value={newMember.email} onChange={(v) => setNewMember({ ...newMember, email: v })} />
          <Input label="Phone" placeholder="+91-XXXXX-XXXXX" value={newMember.phone} onChange={(v) => setNewMember({ ...newMember, phone: v })} />
          <Select label="Membership Type" value={newMember.membershipType} onChange={(v) => setNewMember({ ...newMember, membershipType: v })}
            options={[{ value: "standard", label: "Standard" },{ value: "premium", label: "Premium" },{ value: "student", label: "Student" }]} />
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleAdd} disabled={saving} className="flex-1">{saving ? "Adding..." : "Add Member"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
