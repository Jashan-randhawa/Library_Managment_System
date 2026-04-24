import { useState, useEffect, useCallback } from "react";
import { Plus, Shield, Users as UsersIcon, UserCog, ToggleLeft, ToggleRight } from "lucide-react";
import {
  PageHeader, Card, Badge, Button, Input, Select,
  Table, Th, Td, TableFooter, Modal, Empty, SkeletonRows, Alert,
} from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { usersApi } from "../lib/api";
import type { StaffUser } from "../types";
import { formatDate } from "../lib/utils";

const roleOptions = [
  { value: "librarian", label: "Librarian" },
  { value: "admin",     label: "Admin" },
];

function UserAvatar({ name, role }: { name: string; role: string }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const cls = role === "admin"
    ? "bg-indigo-100 text-indigo-700"
    : "bg-[var(--skeleton-bg)] text-theme-secondary";
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs ${cls}`}>
      {initials}
    </div>
  );
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [users, setUsers]     = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [newUser, setNewUser] = useState({
    name: "", email: "", password: "", role: "librarian",
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Add ────────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password) {
      setError("All fields are required.");
      return;
    }
    if (newUser.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSaving(true); setError("");
    try {
      await usersApi.create({
        name:     newUser.name.trim(),
        email:    newUser.email.trim(),
        password: newUser.password,
        role:     newUser.role as "admin" | "librarian",
      });
      setAddOpen(false);
      setNewUser({ name: "", email: "", password: "", role: "librarian" });
      fetchUsers();
      toast(`${newUser.name} added as ${newUser.role}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create user");
    } finally { setSaving(false); }
  };

  // ── Toggle active ──────────────────────────────────────────────────────────
  const handleToggle = async (u: StaffUser) => {
    const action = u.isActive ? "Deactivate" : "Reactivate";
    if (!confirm(`${action} ${u.name}? They will ${u.isActive ? "lose" : "regain"} access immediately.`)) return;
    setTogglingId(u._id);
    try {
      await usersApi.toggleActive(u._id);
      fetchUsers();
      toast(`${u.name} has been ${u.isActive ? "deactivated" : "reactivated"}`);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : `Failed to ${action.toLowerCase()} user`, "error");
    } finally { setTogglingId(null); }
  };

  const total  = users.length;
  const active = users.filter(u => u.isActive).length;
  const admins = users.filter(u => u.role === "admin" && u.isActive).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Staff Users"
        subtitle="Manage librarian and admin accounts"
        action={
          <Button onClick={() => { setNewUser({ name: "", email: "", password: "", role: "librarian" }); setError(""); setAddOpen(true); }}>
            <Plus className="w-4 h-4" /> Add User
          </Button>
        }
      />

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-6">
        {[
          { label: "Total Staff", value: total,  cls: "icon-bg-indigo text-indigo-600",   icon: UsersIcon },
          { label: "Active",      value: active, cls: "icon-bg-emerald text-emerald-600", icon: Shield },
          { label: "Admins",      value: admins, cls: "icon-bg-amber text-amber-600",     icon: UserCog },
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

      {/* Table */}
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th className="hidden sm:table-cell">Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th className="hidden sm:table-cell">Created</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={3} cols={6} />
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <Empty message="No staff users found" icon={UsersIcon} />
                </td>
              </tr>
            ) : users.map((u) => (
              <tr key={u._id} className="hover:bg-[var(--bg-card-hover)]/60 transition-colors">
                <Td>
                  <div className="flex items-center gap-3">
                    <UserAvatar name={u.name} role={u.role} />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-theme-primary text-sm">{u.name}</p>
                        {u._id === currentUser?._id && (
                          <Badge variant="info" className="text-[10px] px-1.5 py-0">You</Badge>
                        )}
                      </div>
                      <p className="text-xs text-theme-muted mt-0.5 sm:hidden">{u.email}</p>
                    </div>
                  </div>
                </Td>
                <Td className="hidden sm:table-cell">
                  <span className="text-theme-secondary text-sm">{u.email}</span>
                </Td>
                <Td>
                  <Badge variant={u.role === "admin" ? "default" : "neutral"} dot>
                    {u.role === "admin" ? "Admin" : "Librarian"}
                  </Badge>
                </Td>
                <Td>
                  <Badge variant={u.isActive ? "success" : "danger"} dot>
                    {u.isActive ? "Active" : "Deactivated"}
                  </Badge>
                </Td>
                <Td className="hidden sm:table-cell">
                  <span className="text-theme-secondary text-sm">{formatDate(u.createdAt)}</span>
                </Td>
                <Td>
                  {u._id !== currentUser?._id && (
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => handleToggle(u)}
                        disabled={togglingId === u._id}
                        title={u.isActive ? "Deactivate user" : "Reactivate user"}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                          u.isActive
                            ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                            : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                        }`}
                      >
                        {u.isActive
                          ? <ToggleLeft  className="w-3.5 h-3.5" />
                          : <ToggleRight className="w-3.5 h-3.5" />}
                        {togglingId === u._id
                          ? "…"
                          : u.isActive ? "Deactivate" : "Reactivate"}
                      </button>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {!loading && <TableFooter total={users.length} />}
      </Card>

      {/* Add user modal */}
      <Modal
        open={addOpen}
        onClose={() => { setAddOpen(false); setError(""); }}
        title="Add Staff User"
        subtitle="Create a new librarian or admin account"
      >
        <div className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <Input
            label="Full Name *"
            placeholder="Jane Smith"
            value={newUser.name}
            onChange={(v) => setNewUser({ ...newUser, name: v })}
            autoComplete="name"
          />
          <Input
            label="Email *"
            type="email"
            placeholder="jane@library.com"
            value={newUser.email}
            onChange={(v) => setNewUser({ ...newUser, email: v })}
            autoComplete="email"
          />
          <Input
            label="Password *"
            type="password"
            placeholder="Min 6 characters"
            value={newUser.password}
            onChange={(v) => setNewUser({ ...newUser, password: v })}
            autoComplete="new-password"
          />
          <Select
            label="Role"
            value={newUser.role}
            onChange={(v) => setNewUser({ ...newUser, role: v })}
            options={roleOptions}
          />
          <div className="icon-bg-indigo border border-indigo-100 dark:border-indigo-500/20 rounded-xl px-4 py-3">
            <p className="text-xs text-indigo-700 dark:text-indigo-400 font-medium">
              <strong>Admin</strong> — full system access, can manage staff users.
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-0.5">
              <strong>Librarian</strong> — can manage books, members, loans, and fines.
            </p>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleAdd} disabled={saving} className="flex-1">
              {saving ? "Creating…" : "Create User"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
