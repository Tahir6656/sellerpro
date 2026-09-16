"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Clock3, ShieldCheck } from "lucide-react";

interface WithdrawalMethod {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number;
}

export default function WithdrawPage() {
  const { toast } = useToast();
  const [methods, setMethods] = useState<WithdrawalMethod[]>([]);
  const [balance, setBalance] = useState(0);
  const [requests, setRequests] = useState<{ amount: number; status: string; method: { name: string }; createdAt: string }[]>([]);
  const [form, setForm] = useState({ methodId: "", accountNumber: "", accountHolder: "", amount: "" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/withdrawals").then((r) => r.json()),
      fetch("/api/user/dashboard").then((r) => r.json()),
    ]).then(([w, d]) => {
      if (w.success) {
        setMethods(w.data.methods);
        setRequests(w.data.requests);
      }
      if (d.success) setBalance(d.data.user.balance);
      if (!w.success || !d.success) setLoadError(w.error || d.error || "Could not load withdrawal information");
      setLoading(false);
    }).catch(() => {
      setLoadError("Could not load withdrawal information. Please try again.");
      setLoading(false);
    });
  }, []);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n);

  const selectedMethod = methods.find((method) => method.id === form.methodId);
  const minimumAmount = selectedMethod?.minAmount || 300;
  const amountValue = Number(form.amount);
  const amountValid = Number.isFinite(amountValue) && amountValue >= minimumAmount && amountValue <= balance;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      const json = await res.json();
      if (json.success) {
        toast("Withdrawal time is up to 2–4 hours. If you do not receive it within this time, please contact us through the Help Center. Thank you.", "success");
        setConfirmOpen(false);
        setForm({ methodId: "", accountNumber: "", accountHolder: "", amount: "" });
        window.location.reload();
      } else {
        toast(json.error || "Submission failed", "error");
      }
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="space-y-4"><div className="h-10 w-48 animate-pulse rounded-xl bg-slate-200" /><div className="grid gap-6 lg:grid-cols-2"><div className="h-80 animate-pulse rounded-3xl bg-white/70" /><div className="h-80 animate-pulse rounded-3xl bg-white/70" /></div></div>;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-slate-900 px-6 py-7 text-white shadow-xl shadow-slate-900/10 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Wallet access</p>
        <h1 className="text-3xl font-bold tracking-tight text-white">Withdraw</h1>
        <p className="mt-1 text-sm text-slate-300">Available balance: <span className="font-bold text-white">{formatCurrency(balance)}</span></p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2"><div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm"><Clock3 className="mt-0.5 h-5 w-5 text-blue-600" /><div><p className="font-bold text-slate-900">Processing window</p><p className="mt-1 text-sm text-slate-500">Withdrawal time is up to 2–4 hours after review.</p></div></div><div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm"><ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" /><div><p className="font-bold text-slate-900">Before submitting</p><p className="mt-1 text-sm text-slate-500">Check the account details and amount carefully.</p></div></div></div>
      {loadError && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError}</div>}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Request Withdrawal">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Withdrawal Method</label>
              <select
                value={form.methodId}
                onChange={(e) => setForm({ ...form, methodId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">Select method</option>
                {methods.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} (Min: {m.minAmount})</option>
                ))}
              </select>
            </div>
            <Input label="Account/Mobile Number" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
            <Input label="Account Holder Name" value={form.accountHolder} onChange={(e) => setForm({ ...form, accountHolder: e.target.value })} />
            <Input label={`Amount (Minimum ${formatCurrency(minimumAmount)})`} type="number" min={minimumAmount} max={balance} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} error={form.amount && !amountValid ? `Enter between ${formatCurrency(minimumAmount)} and your available balance.` : undefined} />
            <Button className="w-full" onClick={() => setConfirmOpen(true)} disabled={!form.methodId || !form.amount || !amountValid}>
              Submit Withdrawal
            </Button>
          </div>
        </Card>

        <Card title="Withdrawal History">
          {requests.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No withdrawal history</p>
          ) : (
            <div className="space-y-3">
              {requests.map((r, i) => (
                <div key={i} className="flex items-center justify-between rounded-2xl border border-blue-50 bg-slate-50 p-3 text-sm">
                  <div>
                    <p className="font-medium">{formatCurrency(r.amount)}</p>
                    <p className="text-slate-500">{r.method.name}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    r.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                    r.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  }`}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm Withdrawal">
        <p className="text-slate-600 mb-4">
          Withdraw {formatCurrency(parseFloat(form.amount || "0"))} to {form.accountHolder} ({form.accountNumber})?
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button className="flex-1" loading={submitting} onClick={handleSubmit}>Confirm</Button>
        </div>
      </Modal>
    </div>
  );
}
