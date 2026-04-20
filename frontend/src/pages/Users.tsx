import { useState, useEffect, useCallback } from "react";
import { Plus, Shield, User2, ShieldOff } from "lucide-react";
import { PageHeader, Card, Badge, Button, Input, Select, Table, Th, Td, TableFooter, Modal, Empty, SkeletonRows } from "../components/ui";
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
    if (!newUser.name || !newUser.email || !newUser.password) { setError("All fields are required"); return; }
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
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to create user"); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`Deactivate ${name}? They will lose access immediately.`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE", headers: getAuthHeaders(token) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      fetchUsers();
      toast(`${name} has been deactivated`);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "Failed to deactivate user", "error");
    }
  };

  const active = users.filter(u => u.isActive).length;
  const admins = users.filter(u => u.role === "admin" && u.isActive).length;

  return (
    <div className="p-4 sm:p-8">
      <PageHeader
        title="Staff Users"
        subtitle="Manage librarian and admin accounts"
        action={<Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4" /> Add User</Button>}
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Staff", value: users.length, icon: User2, color: "text-indigo-600 bg-indigo-50" },
          { label: "Active", value: active, icon: Shield, color: "text-emerald-600 bg-emerald-50" },
          { label: "Admins", value: admins, icon: ShieldOff, color: "text-amber-600 bg-amber-50" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-4 h-4" /></div>
            <div><p className="text-2xl font-bold text-slate-800">{value}</p><p className="text-xs text-slate-500">{label}</p></div>
          </Card>
        ))}
      </div>

      <Card>
        <Table>
          <thead>
            <tr className="bg-slate-50/70">
              <Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Status</Th><Th>Created</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? <SkeletonRows rows={3} cols={6} /> :
              users.length === 0 ? (
                <tr><td colSpan={6}><Empty message="No staff users found" /></td></tr>
              ) : users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 text-xs font-bold">
                          {u.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{u.name}</p>
                        {u._id === currentUser?._id && (
                          <span className="text-xs text-indigo-500 font-medium">You</span>
                        )}
                      </div>
                    </div>
                  </Td>
                  <Td><span className="text-slate-500 text-sm">{u.email}</span></Td>
                  <Td>
                    <Badge variant={u.role === "admin" ? "default" : "neutral"}>
                      {u.role === "admin" ? "⚡ Admin" : "Librarian"}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge variant={u.isActive ? "success" : "danger"}>
                      {u.isActive ? "Active" : "Deactivated"}
                    </Badge>
                  </Td>
                  <Td>{formatDate(u.createdAt)}</Td>
                  <Td>
                    {u.isActive && u._id !== currentUser?._id && (
                      <Button
                        variant="ghost"
                        className="text-xs px-2 py-1 text-red-500 hover:bg-red-50"
                        onClick={() => handleDeactivate(u._id, u.name)}
                      >
                        Deactivate
                      </Button>
                    )}
                  </Td>
                </tr>
              ))
            }
          </tbody>
        </Table>
        {!loading && <TableFooter total={users.length} />}
      </Card>

      <Modal open={addOpen} onClose={() => { setAddOpen(false); setError(""); }} title="Add Staff User">
        <div className="space-y-3">
          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <Input label="Full Name *" placeholder="Jane Smith" value={newUser.name} onChange={(v) => setNewUser({ ...newUser, name: v })} />
          <Input label="Email *" type="email" placeholder="jane@library.com" value={newUser.email} onChange={(v) => setNewUser({ ...newUser, email: v })} />
          <Input label="Password *" type="password" placeholder="Min 6 characters" value={newUser.password} onChange={(v) => setNewUser({ ...newUser, password: v })} />
          <Select
            label="Role"
            value={newUser.role}
            onChange={(v) => setNewUser({ ...newUser, role: v })}
            options={roleOptions}
          />
          <p className="text-xs text-slate-400 bg-slate-50 px-3 py-2 rounded-lg">
            Admins can manage users. Librarians have access to all other features.
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleAdd} disabled={saving} className="flex-1">{saving ? "Creating..." : "Create User"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
