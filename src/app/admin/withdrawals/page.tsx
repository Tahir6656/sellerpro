"use client";

import { useEffect, useState, useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useSSE } from "@/hooks/useApi";

interface WithdrawalRequest {
  id: string;
  status: string;
  amount: number;
  accountNumber: string;
  accountHolder: string;
  createdAt: string;
  user: { username: string; id: string };
  method: { name: string };
}

export default function AdminWithdrawalsPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/admin/withdrawals");
    const json = await res.json();
    if (json.success) setRequests(json.data);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useSSE(() => fetchData());

  const handleAction = async (requestId: string, action: string) => {
    const txReference = action === "complete" ? prompt("Transaction reference:") : undefined;
    const res = await fetch("/api/admin/withdrawals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action, txReference }),
    });
    const json = await res.json();
    toast(json.data?.message || json.error || "Done", json.success ? "success" : "error");
    if (json.success) fetchData();
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n);

  const visibleRequests = requests.filter((request) => {
    const matchesSearch = `${request.user.username} ${request.method.name} ${request.accountNumber}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (!statusFilter || request.status === statusFilter);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-coral)]">Payout queue</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Withdrawal Management</h1></div><div className="flex flex-wrap gap-2"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search user or account" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter withdrawals by status" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">All statuses</option><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="COMPLETED">Completed</option><option value="REJECTED">Rejected</option></select></div></div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 pr-4">Method</th>
                <th className="pb-3 pr-4">Account</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRequests.map((r) => (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="py-3 pr-4 font-medium">{r.user.username}</td>
                  <td className="py-3 pr-4">{r.method.name}</td>
                  <td className="py-3 pr-4">
                    <p>{r.accountHolder}</p>
                    <p className="text-slate-500">{r.accountNumber}</p>
                  </td>
                  <td className="py-3 pr-4">{formatCurrency(r.amount)}</td>
                  <td className="py-3 pr-4">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs">{r.status}</span>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.status === "PENDING" && (
                        <>
                          <Button size="sm" onClick={() => handleAction(r.id, "approve")}>Approve</Button>
                          <Button size="sm" variant="danger" onClick={() => handleAction(r.id, "reject")}>Reject</Button>
                        </>
                      )}
                      {r.status === "APPROVED" && (
                        <Button size="sm" onClick={() => handleAction(r.id, "complete")}>Complete</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visibleRequests.length && <p className="py-10 text-center text-sm text-slate-500">No withdrawals match these filters.</p>}
        </div>
      </Card>
    </div>
  );
}
