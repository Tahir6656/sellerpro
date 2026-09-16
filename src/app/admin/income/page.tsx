"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Gift, Wallet } from "lucide-react";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { useSSE } from "@/hooks/useApi";

interface IncomeData {
  totalInvestments: number;
  investmentCount: number;
  totalWithdrawals: number;
  withdrawalCount: number;
  totalReferralRewards: number;
  referralRewardCount: number;
  remainingAmount: number;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(amount);

export default function AdminIncomePage() {
  const [income, setIncome] = useState<IncomeData | null>(null);
  const [error, setError] = useState("");

  const fetchIncome = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/income");
      const json = await response.json();
      if (json.success) setIncome(json.data);
      else setError(json.error || "Could not load income summary");
    } catch {
      setError("Could not load income summary");
    }
  }, []);

  useEffect(() => { fetchIncome(); }, [fetchIncome]);
  useSSE(() => fetchIncome());

  if (!income) return <div className="space-y-5"><Skeleton className="h-28" /><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"><Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" /></div></div>;

  const cards = [
    { label: "Approved investments", value: income.totalInvestments, count: `${income.investmentCount} approved`, icon: ArrowDownToLine, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Accepted withdrawals", value: income.totalWithdrawals, count: `${income.withdrawalCount} accepted`, icon: ArrowUpFromLine, tone: "bg-orange-50 text-orange-700" },
    { label: "Referral rewards paid", value: income.totalReferralRewards, count: `${income.referralRewardCount} rewards`, icon: Gift, tone: "bg-fuchsia-50 text-fuchsia-700" },
    { label: "Remaining in accounts", value: income.remainingAmount, count: "Investments minus all outflows", icon: Wallet, tone: "bg-blue-50 text-blue-700" },
  ];

  return <div className="space-y-6"><div className="rounded-3xl bg-[var(--brand-ink)] px-6 py-7 text-white shadow-xl shadow-slate-900/10 lg:px-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-gold)]">Money overview</p><h1 className="mt-2 text-3xl font-black tracking-tight">Income</h1><p className="mt-1 max-w-2xl text-sm text-slate-300">Track approved investments received, accepted withdrawals, referral rewards paid, and the amount remaining in user accounts.</p></div>{error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{cards.map((card) => { const Icon = card.icon; return <Card key={card.label} className="!p-5"><div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-2xl ${card.tone}`}><Icon className="h-5 w-5" /></div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{card.label}</p><p className={`mt-2 text-2xl font-black ${card.value < 0 ? "text-red-600" : "text-slate-900"}`}>{formatCurrency(card.value)}</p><p className="mt-1 text-xs text-slate-500">{card.count}</p></Card>; })}</div><Card title="Account calculation" subtitle="The remaining figure is calculated from approved records."><div className="flex flex-wrap items-center gap-3 text-sm font-bold"><span className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700">{formatCurrency(income.totalInvestments)} received</span><span className="text-slate-400">−</span><span className="rounded-xl bg-orange-50 px-3 py-2 text-orange-700">{formatCurrency(income.totalWithdrawals)} withdrawals</span><span className="text-slate-400">−</span><span className="rounded-xl bg-fuchsia-50 px-3 py-2 text-fuchsia-700">{formatCurrency(income.totalReferralRewards)} rewards</span><span className="text-slate-400">=</span><span className="rounded-xl bg-blue-600 px-3 py-2 text-white">{formatCurrency(income.remainingAmount)} remaining</span></div></Card></div>;
}