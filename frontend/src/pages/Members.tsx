import { useState, useEffect, useCallback } from "react";
import { Plus, Users, UserCheck, UserX, Clock, Pencil, Trash2 } from "lucide-react";
import {
  PageHeader, Card, Badge, Button, Input, Select,
  Table, Th, Td, TableFooter, Modal, Empty, SkeletonRows, Alert, SearchBar,
} from "../components/ui";
import { membersApi } from "../lib/api";
import type { Member, MemberUpdate } from "../types";
import { formatDate, formatCurrency, useDebounce } from "../lib/utils";
import { useToast } from "../components/Toast";

const statusOptions = [
  { value: "",            label: "All Status" },
  { value: "active",     label: "Active" },
  { value: "suspended",  label: "Suspended" },
  { value: "expired",    label: "Expired" },
];
const membershipOptions = [
  { value: "",          label: "All Types" },
  { value: "standard",  label: "Standard" },
  { value: "premium",   label: "Premium" },
  { value: "student",   label: "Student" },
];

const membershipBadge: Record<string, "default" | "success" | "neutral"> = {
  premium: "success", standard: "default", student: "neutral",
};
const statusBadge: Record<string, "success" | "danger" | "warning"> = {
  active: "success", suspended: "danger", expired: "warning",
};

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const colors = [
    "bg-indigo-100 text-indigo-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-sky-100 text-sky-700",
    "bg-purple-100 text-purple-700",
  ];
  const colorCls = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-9 h-9 ${colorCls} rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs`}>
      {initials}
    </div>
  );
}

// ─── Edit form state ──────────────────────────────────────────────────────────
interface EditForm {
  name: string;
  phone: string;
  membershipType: string;
  status: string;
}

function memberToEditForm(m: Member): EditForm {
  return { name: m.name, phone: m.phone || "", membershipType: m.membershipType, status: m.status };
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Members() {
  const { toast } = useToast();
  const [members, setMembers]         = useState<Member[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [status, setStatus]           = useState("");
  const [membership, setMembership]   = useState("");

  // Add modal
  const [addOpen, setAddOpen]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [addError, setAddError]       = useState("");
  const [newMember, setNewMember]     = useState({
    name: "", email: "", phone: "", membershipType: "standard",
  });

  // Edit modal
  const [editMember, setEditMember]   = useState<Member | null>(null);
  const [editForm, setEditForm]       = useState<EditForm>({ name: "", phone: "", membershipType: "standard", status: "active" });
  const [editError, setEditError]     = useState("");
  const [editSaving, setEditSaving]   = useState(false);

  // Delete confirm
  const [deleteMember, setDeleteMember] = useState<Member | null>(null);
  const [deleting, setDeleting]         = useState(false);

  const debouncedSearch = useDebounce(search);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await membersApi.getAll({ search: debouncedSearch, status, membershipType: membership });
      setMembers(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [debouncedSearch, status, membership]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  // ── Add ──────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!newMember.name.trim() || !newMember.email.trim()) {
      setAddError("Name and email are required.");
      return;
    }
    setSaving(true); setAddError("");
    try {
      await membersApi.create({
        name: newMember.name.trim(),
        email: newMember.email.trim(),
        phone: newMember.phone.trim(),
        membershipType: newMember.membershipType as "standard" | "premium" | "student",
      });
      setAddOpen(false);
      setNewMember({ name: "", email: "", phone: "", membershipType: "standard" });
      fetchMembers();
      toast(`${newMember.name} added as a member`);
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : "Failed to add member");
    } finally { setSaving(false); }
  };

  // ── Edit open ────────────────────────────────────────────────────────────
  const openEdit = (member: Member) => {
    setEditMember(member);
    setEditForm(memberToEditForm(member));
    setEditError("");
  };

  // ── Edit save ────────────────────────────────────────────────────────────
  const handleEdit = async () => {
    if (!editMember) return;
    if (!editForm.name.trim()) { setEditError("Name is required."); return; }
    setEditSaving(true); setEditError("");
    try {
      const update: MemberUpdate = {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        membershipType: editForm.membershipType as "standard" | "premium" | "student",
        status: editForm.status as "active" | "suspended" | "expired",
      };
      await membersApi.update(editMember._id, update);
      setEditMember(null);
      fetchMembers();
      toast(`${editForm.name}'s profile updated`);
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : "Failed to update member");
    } finally { setEditSaving(false); }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteMember) return;
    setDeleting(true);
    try {
      await membersApi.delete(deleteMember._id);
      setDeleteMember(null);
      fetchMembers();
      toast(`${deleteMember.name} removed`);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "Failed to delete member", "error");
      setDeleteMember(null);
    } finally { setDeleting(false); }
  };

  const active    = members.filter(m => m.status === "active").length;
  const suspended = members.filter(m => m.status === "suspended").length;
  const expired   = members.filter(m => m.status === "expired").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Members"
        subtitle={`${members.length} members registered`}
        action={
          <Button onClick={() => { setNewMember({ name: "", email: "", phone: "", membershipType: "standard" }); setAddError(""); setAddOpen(true); }}>
            <Plus className="w-4 h-4" /> Add Member
          </Button>
        }
      />

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-6">
        {[
          { label: "Active Members", value: active,    cls: "icon-bg-emerald text-emerald-600", icon: UserCheck },
          { label: "Suspended",      value: suspended, cls: "icon-bg-red text-red-600",         icon: UserX },
          { label: "Expired",        value: expired,   cls: "icon-bg-amber text-amber-600",     icon: Clock },
        ].map(({ label, value, cls, icon: Icon }) => (
          <Card key={label} className="p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3.5">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 ${cls}`}>
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0 text-center sm:text-left">
              <p className="text-xl sm:text-3xl font-bold text-theme-primary leading-none tabular-nums">{value}</p>
              <p className="text-xs text-theme-muted font-semibold mt-1 leading-tight">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email…" />
          <Select value={status} onChange={setStatus} options={statusOptions} className="w-full sm:w-auto sm:min-w-36" />
          <Select value={membership} onChange={setMembership} options={membershipOptions} className="w-full sm:w-auto sm:min-w-36" />
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Member</Th>
              <Th className="hidden sm:table-cell">Phone</Th>
              <Th>Membership</Th>
              <Th className="hidden sm:table-cell">Joined</Th>
              <Th className="hidden sm:table-cell">Loans</Th>
              <Th>Fines Owed</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={6} cols={8} />
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <Empty message="No members found" hint="Try adjusting your filters or add a new member" icon={Users} />
                </td>
              </tr>
            ) : members.map((m) => (
              <tr key={m._id} className="hover:bg-[var(--bg-card-hover)]/60 transition-colors group">
                <Td className="whitespace-normal">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} />
                    <div>
                      <p className="font-bold text-theme-primary text-sm whitespace-nowrap">{m.name}</p>
                      <p className="text-xs text-theme-muted mt-0.5 font-medium">{m.email}</p>
                    </div>
                  </div>
                </Td>
                <Td className="hidden sm:table-cell">
                  <span className="text-theme-secondary text-sm font-medium">{m.phone || "—"}</span>
                </Td>
                <Td><Badge variant={membershipBadge[m.membershipType]} dot>{m.membershipType}</Badge></Td>
                <Td className="hidden sm:table-cell">
                  <span className="text-theme-secondary font-medium">{formatDate(m.joinDate)}</span>
                </Td>
                <Td className="hidden sm:table-cell">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--skeleton-bg)] text-theme-secondary text-xs font-bold">
                    {m.loansCount}
                  </span>
                </Td>
                <Td>
                  {m.finesOwed > 0 ? (
                    <span className="text-red-600 font-bold text-sm">{formatCurrency(m.finesOwed)}</span>
                  ) : (
                    <span className="text-slate-300 font-medium">—</span>
                  )}
                </Td>
                <Td><Badge variant={statusBadge[m.status]} dot>{m.status}</Badge></Td>
                <Td>
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(m)}
                      title="Edit member"
                      className="p-2 rounded-lg text-theme-tertiary hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteMember(m)}
                      title="Delete member"
                      className="p-2 rounded-lg text-theme-tertiary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {!loading && <TableFooter total={members.length} />}
      </Card>

      {/* ── Add member modal ──────────────────────────────────────────────── */}
      <Modal
        open={addOpen}
        onClose={() => { setAddOpen(false); setAddError(""); }}
        title="Add New Member"
        subtitle="Register a new library member"
      >
        <div className="space-y-4">
          {addError && <Alert variant="error">{addError}</Alert>}
          <Input label="Full Name *" placeholder="Jane Doe" value={newMember.name} onChange={(v) => setNewMember({ ...newMember, name: v })} autoComplete="name" />
          <Input label="Email *" type="email" placeholder="jane@email.com" value={newMember.email} onChange={(v) => setNewMember({ ...newMember, email: v })} autoComplete="email" />
          <Input label="Phone" type="tel" placeholder="+91-XXXXX-XXXXX" value={newMember.phone} onChange={(v) => setNewMember({ ...newMember, phone: v })} autoComplete="tel" />
          <Select
            label="Membership Type"
            value={newMember.membershipType}
            onChange={(v) => setNewMember({ ...newMember, membershipType: v })}
            options={[
              { value: "standard", label: "Standard" },
              { value: "premium",  label: "Premium" },
              { value: "student",  label: "Student" },
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

      {/* ── Edit member modal ─────────────────────────────────────────────── */}
      <Modal
        open={!!editMember}
        onClose={() => { setEditMember(null); setEditError(""); }}
        title="Edit Member"
        subtitle={editMember ? `Editing ${editMember.name}'s profile` : ""}
      >
        <div className="space-y-4">
          {editError && <Alert variant="error">{editError}</Alert>}
          <Input
            label="Full Name *"
            placeholder="Jane Doe"
            value={editForm.name}
            onChange={(v) => setEditForm({ ...editForm, name: v })}
          />
          <Input
            label="Phone"
            type="tel"
            placeholder="+91-XXXXX-XXXXX"
            value={editForm.phone}
            onChange={(v) => setEditForm({ ...editForm, phone: v })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Membership Type"
              value={editForm.membershipType}
              onChange={(v) => setEditForm({ ...editForm, membershipType: v })}
              options={[
                { value: "standard", label: "Standard" },
                { value: "premium",  label: "Premium" },
                { value: "student",  label: "Student" },
              ]}
            />
            <Select
              label="Status"
              value={editForm.status}
              onChange={(v) => setEditForm({ ...editForm, status: v })}
              options={[
                { value: "active",    label: "Active" },
                { value: "suspended", label: "Suspended" },
                { value: "expired",   label: "Expired" },
              ]}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" onClick={() => setEditMember(null)} className="flex-1">Cancel</Button>
            <Button onClick={handleEdit} disabled={editSaving} className="flex-1">
              {editSaving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete confirm modal ──────────────────────────────────────────── */}
      <Modal
        open={!!deleteMember}
        onClose={() => setDeleteMember(null)}
        title="Remove Member"
        subtitle="This action cannot be undone"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20">
            <Trash2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-theme-primary">
                Remove <span className="text-red-600 dark:text-red-400">{deleteMember?.name}</span>?
              </p>
              <p className="text-xs text-theme-secondary mt-1">
                This will permanently remove this member from the system, including their loan and fine history.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setDeleteMember(null)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting} className="flex-1">
              {deleting ? "Removing…" : "Remove Member"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
