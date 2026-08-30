"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useSSE } from "@/hooks/useApi";

interface Plan {
  id: string;
  name: string;
  products: number;
  durationDays: number;
  investment: number;
  statedReturn: number;
}

interface PaymentAccount {
  id: string;
  methodName: string;
  accountHolder: string;
  accountNumber: string;
  mobileId: string | null;
  instructions: string | null;
}

export default function PlansPage() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/config/public");
    const json = await res.json();
    if (json.success) {
      setPlans(json.data.plans);
      setAccounts(json.data.paymentAccounts);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useSSE(() => fetchData());

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n);

  const handleSubmit = async () => {
    if (!selectedPlan || !selectedAccount || !screenshot) {
      toast("Please select plan, payment method, and upload screenshot", "error");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("planId", selectedPlan.id);
      formData.append("paymentAccountId", selectedAccount);
      formData.append("screenshot", screenshot);

      const res = await fetch("/api/payments", { method: "POST", body: formData });
      const json = await res.json();
      if (json.success) {
        toast("Payment request submitted. Please wait for administrator verification.", "success");
        setSelectedPlan(null);
        setScreenshot(null);
      } else {
        toast(json.error || "Submission failed", "error");
      }
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-slate-500">Loading plans...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Available Plans</h1>
        <p className="text-slate-500 mt-1">Choose a plan and activate it to get started</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
            <p className="text-2xl font-bold text-blue-600 my-3">{formatCurrency(plan.investment)}</p>
            <ul className="space-y-1.5 text-sm text-slate-700 mb-5">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-amber-500" />{plan.products} Products</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-amber-500" />{plan.durationDays} Days</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-amber-500" />Return: {formatCurrency(plan.statedReturn)}</li>
            </ul>
            <Button className="w-full" size="sm" onClick={() => setSelectedPlan(plan)}>
              Activate Plan
            </Button>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={!!selectedPlan}
        onClose={() => { setSelectedPlan(null); setScreenshot(null); }}
        title={`Activate ${selectedPlan?.name}`}
        size="lg"
      >
        {selectedPlan && (
          <div className="space-y-5">
            <div className="bg-blue-50 rounded-xl p-4 text-sm border border-blue-100">
              <p className="font-medium text-blue-900">Amount to pay: {formatCurrency(selectedPlan.investment)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select payment method</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.methodName}</option>
                ))}
              </select>
            </div>

            {selectedAccount && (() => {
              const acc = accounts.find((a) => a.id === selectedAccount);
              return acc ? (
                <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1">
                  <p><strong>Account Holder:</strong> {acc.accountHolder}</p>
                  <p><strong>Account Number:</strong> {acc.accountNumber}</p>
                  {acc.mobileId && <p><strong>Mobile:</strong> {acc.mobileId}</p>}
                  {acc.instructions && <p className="text-slate-600 mt-2">{acc.instructions}</p>}
                </div>
              ) : null;
            })()}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Payment Screenshot</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                className="w-full text-sm"
              />
            </div>

            <Button className="w-full" loading={submitting} onClick={handleSubmit}>
              Submit Payment Request
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
