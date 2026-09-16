"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";

interface User {
  id: string;
  username: string;
  email: string;
  mobile: string;
  accountStatus: string;
  balance: number;
  registrationDate: string;
  activePlan: { plan: { name: string } } | null;
  referrer: { username: string } | null;
  _count: { referrals: number };
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [adjustmentAmounts, setAdjustmentAmounts] = useState<Record<string, string>>({});
  const [adjustmentReasons, setAdjustmentReasons] = useState<Record<string, string>>({});
  const [adjustingUserId, setAdjustingUserId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetchUsers = async (q?: string) => {
    const query = new URLSearchParams();
    if (q) query.set("search", q);
    if (statusFilter) query.set("status", statusFilter);
    query.set("page", String(page));
    const params = query.toString() ? `?${query.toString()}` : "";
    const res = await fetch(`/api/admin/users${params}`);
    const json = await res.json();
    if (json.success) { setUsers(json.data.items); setPagination(json.data.pagination); }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [statusFilter, page]);

  const handleAction = async (userId: string, action: string) => {
    const res = await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    });
    const json = await res.json();
    toast(json.data?.message || json.error || "Done", json.success ? "success" : "error");
    if (json.success) fetchUsers(search);
  };

  const handleBalanceAdjustment = async (userId: string, direction: "add" | "remove") => {
    const value = Number(adjustmentAmounts[userId]);
    const reason = adjustmentReasons[userId]?.trim();
    if (!Number.isFinite(value) || value <= 0 || !reason) {
      toast("Enter a positive amount and reason", "error");
      return;
    }

    setAdjustingUserId(userId);
    const res = await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        action: "adjust-balance",
        amount: direction === "add" ? value : -value,
        reason,
      }),
    });
    const json = await res.json();
    toast(json.data?.message || json.error || "Done", json.success ? "success" : "error");
    setAdjustingUserId(null);
    if (json.success) {
      setAdjustmentAmounts((current) => ({ ...current, [userId]: "" }));
      setAdjustmentReasons((current) => ({ ...current, [userId]: "" }));
      fetchUsers(search);
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="!py-2" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter users by status" className="rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="FROZEN">Frozen</option><option value="DEACTIVATED">Deactivated</option></select>
          <Button size="sm" onClick={() => { setPage(1); fetchUsers(search); }}>Search</Button>
        </div>
      </div>

      <Card>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 pr-4">Contact</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Balance</th>
                <th className="pb-3 pr-4">Plan</th>
                <th className="pb-3 pr-4">Referrals</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-50">
                  <td className="py-3 pr-4">
                    <button type="button" onClick={() => setSelectedUser(u)} className="font-medium text-left text-blue-700 hover:underline">{u.username}</button>
                    <p className="text-xs text-slate-400">{u.id.slice(0, 8)}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <p>{u.email}</p>
                    <p className="text-slate-500">{u.mobile}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.accountStatus === "ACTIVE" ? "bg-emerald-100 text-emerald-700" :
                      u.accountStatus === "FROZEN" ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    }`}>{u.accountStatus}</span>
                  </td>
                  <td className="py-3 pr-4 min-w-64">
                    <p className="font-medium mb-2">{formatCurrency(u.balance)}</p>
                    <div className="space-y-1.5">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Amount"
                        value={adjustmentAmounts[u.id] || ""}
                        onChange={(e) => setAdjustmentAmounts((current) => ({ ...current, [u.id]: e.target.value }))}
                        className="!py-1.5 !px-2 text-xs"
                      />
                      <Input
                        placeholder="Reason"
                        value={adjustmentReasons[u.id] || ""}
                        onChange={(e) => setAdjustmentReasons((current) => ({ ...current, [u.id]: e.target.value }))}
                        className="!py-1.5 !px-2 text-xs"
                      />
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => handleBalanceAdjustment(u.id, "add")} disabled={adjustingUserId === u.id}>
                          Add
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleBalanceAdjustment(u.id, "remove")} disabled={adjustingUserId === u.id}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4">{u.activePlan?.plan.name || "—"}</td>
                  <td className="py-3 pr-4">{u._count.referrals}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.accountStatus !== "FROZEN" && (
                        <Button size="sm" variant="ghost" onClick={() => handleAction(u.id, "freeze")}>Freeze</Button>
                      )}
                      {u.accountStatus === "FROZEN" && (
                        <Button size="sm" variant="ghost" onClick={() => handleAction(u.id, "unfreeze")}>Unfreeze</Button>
                      )}
                      {u.accountStatus !== "DEACTIVATED" ? (
                        <Button size="sm" variant="danger" onClick={() => handleAction(u.id, "deactivate")}>Deactivate</Button>
                      ) : (
                        <Button size="sm" onClick={() => handleAction(u.id, "reactivate")}>Reactivate</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 space-y-3 md:hidden">{users.map((u) => <div key={u.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><button type="button" onClick={() => setSelectedUser(u)} className="font-bold text-blue-700">{u.username}</button><p className="text-xs text-slate-500">{u.email}</p><p className="text-xs text-slate-500">{u.mobile}</p></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{u.accountStatus}</span></div><div className="mt-3 grid grid-cols-2 gap-2 text-sm"><div><p className="text-xs text-slate-500">Balance</p><p className="font-bold">{formatCurrency(u.balance)}</p></div><div><p className="text-xs text-slate-500">Referrals</p><p className="font-bold">{u._count.referrals}</p></div></div><div className="mt-3 flex gap-2">{u.accountStatus === "FROZEN" ? <Button size="sm" onClick={() => handleAction(u.id, "unfreeze")}>Unfreeze</Button> : <Button size="sm" variant="ghost" onClick={() => handleAction(u.id, "freeze")}>Freeze</Button>}<Button size="sm" variant="danger" onClick={() => handleAction(u.id, u.accountStatus === "DEACTIVATED" ? "reactivate" : "deactivate")}>{u.accountStatus === "DEACTIVATED" ? "Reactivate" : "Deactivate"}</Button></div></div>)}</div>
          {loading && <p className="text-center py-8 text-slate-500">Loading...</p>}
          <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />
        </div>
      </Card>
      <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="User details" size="md">
        {selectedUser && <div className="space-y-4 text-sm"><div className="flex items-center gap-3 rounded-2xl bg-blue-50 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white">{selectedUser.username.slice(0, 1).toUpperCase()}</div><div><p className="text-lg font-bold text-slate-900">{selectedUser.username}</p><p className="text-slate-500">{selectedUser.accountStatus}</p></div></div><div className="grid grid-cols-2 gap-3"><div><p className="text-xs text-slate-500">Email</p><p className="font-medium">{selectedUser.email}</p></div><div><p className="text-xs text-slate-500">Mobile</p><p className="font-medium">{selectedUser.mobile}</p></div><div><p className="text-xs text-slate-500">Balance</p><p className="font-medium">{formatCurrency(selectedUser.balance)}</p></div><div><p className="text-xs text-slate-500">Plan</p><p className="font-medium">{selectedUser.activePlan?.plan.name || "None"}</p></div><div><p className="text-xs text-slate-500">Registered</p><p className="font-medium">{new Date(selectedUser.registrationDate).toLocaleDateString("en-PK")}</p></div><div><p className="text-xs text-slate-500">Referrer</p><p className="font-medium">{selectedUser.referrer?.username || "None"}</p></div></div></div>}
      </Modal>
    </div>
  );
}
