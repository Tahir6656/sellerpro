"use client";

import { useEffect, useState, useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useSSE } from "@/hooks/useApi";
import Pagination from "@/components/ui/Pagination";

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

const getSignedProofUrl = async (requestId: string): Promise<string | null> => {
  const res = await fetch(`/api/admin/payments/${requestId}/screenshot`);
  const json = await res.json();
  if (!json.success) return null;
  return json.data?.url || null;
};

export default function AdminPaymentsPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [selected, setSelected] = useState<PaymentRequest | null>(null);
  const [selectedScreenshotUrl, setSelectedScreenshotUrl] = useState<string | null>(null);
  const [isScreenshotLoading, setIsScreenshotLoading] = useState(false);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/admin/payments?${params}`);
    const json = await res.json();
    if (json.success) { setRequests(json.data.items); setPagination(json.data.pagination); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useSSE(() => fetchData());

  useEffect(() => {
    if (!selected) {
      setSelectedScreenshotUrl(null);
      setIsScreenshotLoading(false);
      setScreenshotError(null);
      return;
    }

    let isMounted = true;
    setIsScreenshotLoading(true);
    setScreenshotError(null);
    setSelectedScreenshotUrl(null);

    getSignedProofUrl(selected.id)
      .then((url) => {
        if (!isMounted) return;
        setSelectedScreenshotUrl(url);
        setIsScreenshotLoading(false);
        setScreenshotError(url ? null : "Payment screenshot is not available.");
      })
      .catch(() => {
        if (!isMounted) return;
        setSelectedScreenshotUrl(null);
        setIsScreenshotLoading(false);
        setScreenshotError("Unable to load payment screenshot.");
      });

    return () => {
      isMounted = false;
    };
  }, [selected]);

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

  const visibleRequests = requests;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-teal)]">Review queue</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Payment Requests</h1></div><div className="flex flex-wrap gap-2"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search user or plan" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter payment requests by status" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">All statuses</option><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option></select></div></div>

      <Card>
        <div className="hidden overflow-x-auto md:block">
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
              {visibleRequests.map((r) => (
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
          <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />
          {!visibleRequests.length && <p className="py-10 text-center text-sm text-slate-500">No payment requests match these filters.</p>}
        </div>
        <div className="space-y-3 md:hidden">{requests.map((r) => <div key={r.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-900">{r.user.username}</p><p className="text-xs text-slate-500">{r.plan.name} · {r.paymentAccount.methodName}</p></div><span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">{r.status}</span></div><p className="mt-3 text-lg font-black">{formatCurrency(r.amount)}</p><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={() => setSelected(r)}>View</Button>{r.status === "PENDING" && <><Button size="sm" onClick={() => handleAction(r.id, "approve")}>Approve</Button><Button size="sm" variant="danger" onClick={() => { setSelected(r); setRejectReason(""); }}>Reject</Button></>}</div></div>)}</div>
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
            {isScreenshotLoading ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                Loading payment screenshot...
              </div>
            ) : screenshotError ? (
              <div className="rounded-xl border border-dashed border-red-200 bg-red-50 p-6 text-sm text-red-600">
                {screenshotError}
              </div>
            ) : selectedScreenshotUrl ? (
              <img src={selectedScreenshotUrl} alt="Payment proof" className="w-full rounded-xl border" />
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                Payment screenshot is not available.
              </div>
            )}
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
