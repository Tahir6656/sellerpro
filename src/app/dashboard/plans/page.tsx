"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowUpRight, CheckCircle, Clock3, Package, Sparkles, TrendingUp } from "lucide-react";
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
  const [loadError, setLoadError] = useState("");
  const [accountPlanIds, setAccountPlanIds] = useState<string[]>([]);
  const [pendingPlanIds, setPendingPlanIds] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [res, dashboardRes] = await Promise.all([fetch("/api/config/public"), fetch("/api/user/dashboard")]);
      const json = await res.json();
      const dashboardJson = await dashboardRes.json();
      if (json.success) {
        setPlans(json.data.plans);
        setAccounts(json.data.paymentAccounts);
      } else setLoadError(json.error || "Could not load plans");
      if (dashboardJson.success) {
        setAccountPlanIds((dashboardJson.data.activePlans || []).map((plan: { plan: { id: string } }) => plan.plan.id));
        setPendingPlanIds([dashboardJson.data.pendingPlan?.planId, dashboardJson.data.pendingPayment?.planId].filter(Boolean));
      }
    } catch {
      setLoadError("Could not load plans. Please try again.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useSSE(() => fetchData());

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n);

  const getReturnRate = (plan: Plan) =>
    Math.round(((plan.statedReturn - plan.investment) / plan.investment) * 100);

  const featuredPlanId = plans.reduce<string | null>((bestId, plan) => {
    if (!bestId) return plan.id;
    const bestPlan = plans.find((candidate) => candidate.id === bestId);
    return bestPlan && getReturnRate(plan) > getReturnRate(bestPlan) ? plan.id : bestId;
  }, null);

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

  if (loading) return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-96 animate-pulse rounded-3xl bg-white/70" />)}</div>;

  return (
    <div className="space-y-8">
      {loadError && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError}</div>}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-7 text-white shadow-xl shadow-slate-900/10 lg:px-8">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
              <Sparkles className="h-3.5 w-3.5" /> Build your momentum
            </div>
            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">Choose your next growth plan</h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">Start with the plan that matches your pace. Every option includes a clear timeline, product access, and a defined return.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[390px]">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm">
              <p className="text-xs text-slate-400">Available</p>
              <p className="mt-1 text-xl font-bold">{plans.length} <span className="text-sm font-normal text-slate-400">plans</span></p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm">
              <p className="text-xs text-slate-400">Starting from</p>
              <p className="mt-1 text-xl font-bold">{plans.length ? formatCurrency(Math.min(...plans.map((plan) => plan.investment))) : "-"}</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 sm:col-span-1">
              <p className="text-xs text-amber-200">Best return</p>
              <p className="mt-1 text-xl font-bold text-amber-300">{plans.length ? `${Math.max(...plans.map(getReturnRate))}%` : "-"}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Available plans</h2>
          <p className="mt-1 text-sm text-slate-500">Compare the details and activate the right fit.</p>
        </div>
        <div className="hidden items-center gap-2 text-xs font-medium text-slate-500 sm:flex">
          <TrendingUp className="h-4 w-4 text-emerald-500" /> Returns shown upfront
        </div>
      </div>

      <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative flex h-full flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${plan.id === featuredPlanId ? "border-blue-500 shadow-lg shadow-blue-600/10" : "hover:border-slate-300"}`}>
            {plan.id === featuredPlanId && (
              <div className="absolute inset-x-0 top-0 bg-blue-600 px-6 py-2 text-center text-xs font-bold uppercase tracking-wider text-white">
                Best return
              </div>
            )}
            <div className={plan.id === featuredPlanId ? "pt-5" : ""}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{plan.durationDays}-day plan</p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">{plan.name}</h3>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${accountPlanIds.includes(plan.id) ? "bg-emerald-50 text-emerald-700" : pendingPlanIds.includes(plan.id) ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{accountPlanIds.includes(plan.id) ? "Active" : pendingPlanIds.includes(plan.id) ? "Pending" : `+${getReturnRate(plan)}%`}</span>
              </div>

              <div className="mt-6 border-b border-slate-100 pb-5">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Investment</p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{formatCurrency(plan.investment)}</p>
                <p className="mt-1 text-sm text-slate-500">Potential return <span className="font-semibold text-emerald-600">{formatCurrency(plan.statedReturn)}</span></p>
              </div>

              <ul className="my-5 space-y-3 text-sm text-slate-700">
                <li className="flex items-center gap-3"><span className="rounded-lg bg-blue-50 p-1.5 text-blue-600"><Package className="h-4 w-4" /></span><span><strong>{plan.products}</strong> products included</span></li>
                <li className="flex items-center gap-3"><span className="rounded-lg bg-amber-50 p-1.5 text-amber-600"><Clock3 className="h-4 w-4" /></span><span><strong>{plan.durationDays} days</strong> timeline</span></li>
                <li className="flex items-center gap-3"><span className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600"><CheckCircle className="h-4 w-4" /></span><span><strong>{formatCurrency(plan.statedReturn - plan.investment)}</strong> projected gain</span></li>
              </ul>
            </div>
            <Button className="mt-auto w-full" size="sm" onClick={() => setSelectedPlan(plan)} disabled={accountPlanIds.includes(plan.id) || pendingPlanIds.includes(plan.id)}>
              {accountPlanIds.includes(plan.id) ? "Plan active" : pendingPlanIds.includes(plan.id) ? "Awaiting review" : "Activate plan"} {!accountPlanIds.includes(plan.id) && !pendingPlanIds.includes(plan.id) && <ArrowUpRight className="h-4 w-4" />}
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
