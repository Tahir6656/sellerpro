"use client";

import { useEffect, useState, useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useSSE } from "@/hooks/useApi";

interface PaymentRequest {
  id: string;
  status: string;
  amount: number;
  screenshotPath: string;
  createdAt: string;
  user: { username: string; id: string };
  plan: { name: string };
  paymentAccount: { methodName: string };
}

export default function AdminPaymentsPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [selected, setSelected] = useState<PaymentRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/admin/payments");
    const json = await res.json();
    if (json.success) setRequests(json.data);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useSSE(() => fetchData());

  const handleAction = async (requestId: string, action: string, rejectionReason?: string) => {
    const res = await fetch("/api/admin/payments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action, rejectionReason }),
    });
    const json = await res.json();
    toast(json.data?.message || json.error || "Done", json.success ? "success" : "error");
    if (json.success) {
      setSelected(null);
      fetchData();
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n);

  const formatDate = (d: string) =>
    new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Payment Requests</h1>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 pr-4">Plan</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Method</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="py-3 pr-4">
                    <p className="font-medium">{r.user.username}</p>
                    <p className="text-xs text-slate-400">{r.user.id.slice(0, 8)}</p>
                  </td>
                  <td className="py-3 pr-4">{r.plan.name}</td>
                  <td className="py-3 pr-4">{formatCurrency(r.amount)}</td>
                  <td className="py-3 pr-4">{r.paymentAccount.methodName}</td>
                  <td className="py-3 pr-4">{formatDate(r.createdAt)}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                      r.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    }`}>{r.status}</span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setSelected(r)}>View</Button>
                      {r.status === "PENDING" && (
                        <>
                          <Button size="sm" onClick={() => handleAction(r.id, "approve")}>Approve</Button>
                          <Button size="sm" variant="danger" onClick={() => { setSelected(r); setRejectReason(""); }}>Reject</Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Payment Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">User:</span> {selected.user.username}</div>
              <div><span className="text-slate-500">Plan:</span> {selected.plan.name}</div>
              <div><span className="text-slate-500">Amount:</span> {formatCurrency(selected.amount)}</div>
              <div><span className="text-slate-500">Method:</span> {selected.paymentAccount.methodName}</div>
            </div>
            <img src={selected.screenshotPath} alt="Payment proof" className="w-full rounded-xl border" />
            {selected.status === "PENDING" && (
              <div className="space-y-3">
                <textarea
                  placeholder="Rejection reason (optional)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                  rows={2}
                />
                <div className="flex gap-3">
                  <Button className="flex-1" onClick={() => handleAction(selected.id, "approve")}>Approve</Button>
                  <Button className="flex-1" variant="danger" onClick={() => handleAction(selected.id, "reject", rejectReason)}>Reject</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
