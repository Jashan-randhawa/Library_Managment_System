import { useState, useEffect, useCallback } from "react";
import { Plus, Shield, Users as UsersIcon, UserCog } from "lucide-react";
import {
  PageHeader, Card, Badge, Button, Input, Select,
  Table, Th, Td, TableFooter, Modal, Empty, SkeletonRows, Alert,
} from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { formatDate } from "../lib/utils";

interface StaffUser {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "librarian";
  isActive: boolean;
  createdAt: string;
}

const roleOptions = [
  { value: "librarian", label: "Librarian" },
  { value: "admin", label: "Admin" },
];

function getAuthHeaders(token: string | null) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function UserAvatar({ name, role }: { name: string; role: string }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const cls = role === "admin"
    ? "bg-indigo-100 text-indigo-700"
    : "bg-slate-100 text-slate-600";
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs ${cls}`}>
      {initials}
    </div>
  );
}

export default function Users() {
  const { token, user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "librarian" });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users", { headers: getAuthHeaders(token) });
      const json = await res.json();
      if (json.success) setUsers(json.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAdd = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      setError("All fields are required.");
      return;
    }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(newUser),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setAddOpen(false);
      setNewUser({ name: "", email: "", password: "", role: "librarian" });
      fetchUsers();
      toast(`${newUser.name} added as ${newUser.role}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create user");
    } finally { setSaving(false); }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`Deactivate ${name}? They will lose access immediately.`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      fetchUsers();
      toast(`${name} has been deactivated`);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "Failed to deactivate user", "error");
    }
  };

  const total   = users.length;
  const active  = users.filter(u => u.isActive).length;
  const admins  = users.filter(u => u.role === "admin" && u.isActive).length;

  return (
    <div className="p-6 sm:p-8">
      <PageHeader
        title="Staff Users"
        subtitle="Manage librarian and admin accounts"
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" /> Add User
          </Button>
        }
      />

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Staff",  value: total,   cls: "bg-indigo-50 text-indigo-600",  icon: UsersIcon },
          { label: "Active",       value: active,  cls: "bg-emerald-50 text-emerald-600", icon: Shield },
          { label: "Admins",       value: admins,  cls: "bg-amber-50 text-amber-600",    icon: UserCog },
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

      {/* Table */}
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th>Actions</Th>
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
              <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                <Td>
                  <div className="flex items-center gap-3">
                    <UserAvatar name={u.name} role={u.role} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800 text-sm">{u.name}</p>
                        {u._id === currentUser?._id && (
                          <Badge variant="info" className="text-[10px] px-1.5 py-0">You</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Td>
                <Td><span className="text-slate-500 text-sm">{u.email}</span></Td>
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
                <Td><span className="text-slate-500">{formatDate(u.createdAt)}</span></Td>
                <Td>
                  {u.isActive && u._id !== currentUser?._id && (
                    <Button
                      variant="ghost"
                      className="text-xs px-2.5 py-1.5 h-auto text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleDeactivate(u._id, u.name)}
                    >
                      Deactivate
                    </Button>
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
          />
          <Input
            label="Email *"
            type="email"
            placeholder="jane@library.com"
            value={newUser.email}
            onChange={(v) => setNewUser({ ...newUser, email: v })}
          />
          <Input
            label="Password *"
            type="password"
            placeholder="Min 6 characters"
            value={newUser.password}
            onChange={(v) => setNewUser({ ...newUser, password: v })}
          />
          <Select
            label="Role"
            value={newUser.role}
            onChange={(v) => setNewUser({ ...newUser, role: v })}
            options={roleOptions}
          />
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
            <p className="text-xs text-indigo-700 font-medium">
              <strong>Admin</strong> — can manage staff users and has full system access.
            </p>
            <p className="text-xs text-indigo-600 mt-0.5">
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
