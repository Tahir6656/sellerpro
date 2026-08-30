"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

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

  const fetchUsers = async (q?: string) => {
    const params = q ? `?search=${encodeURIComponent(q)}` : "";
    const res = await fetch(`/api/admin/users${params}`);
    const json = await res.json();
    if (json.success) setUsers(json.data);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

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

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <div className="flex gap-2">
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="!py-2" />
          <Button size="sm" onClick={() => fetchUsers(search)}>Search</Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
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
                    <p className="font-medium">{u.username}</p>
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
                  <td className="py-3 pr-4">{formatCurrency(u.balance)}</td>
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
          {loading && <p className="text-center py-8 text-slate-500">Loading...</p>}
        </div>
      </Card>
    </div>
  );
}
