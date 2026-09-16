"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, CreditCard, Wallet, Layers, GitBranch, KeyRound } from "lucide-react";
import Card from "@/components/ui/Card";
import { useSSE } from "@/hooks/useApi";
import Skeleton from "@/components/ui/Skeleton";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  frozenUsers: number;
  deactivatedUsers: number;
  activePlans: number;
  pendingPlans: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  totalReferrals: number;
  pendingPasswordResets: number;
  totalBalance: number;
  transactionChart: { date: string; deposits: number; withdrawals: number }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats");
    const json = await res.json();
    if (json.success) setStats(json.data);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useSSE(() => fetchStats());

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n);

  const cards = stats ? [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "bg-blue-500" },
    { label: "Active Users", value: stats.activeUsers, icon: Users, color: "bg-blue-500" },
    { label: "Frozen Users", value: stats.frozenUsers, icon: Users, color: "bg-amber-500" },
    { label: "Deactivated", value: stats.deactivatedUsers, icon: Users, color: "bg-red-500" },
    { label: "Active Plans", value: stats.activePlans, icon: Layers, color: "bg-cyan-600" },
    { label: "Pending Plans", value: stats.pendingPlans, icon: Layers, color: "bg-orange-500" },
    { label: "Pending Deposits", value: stats.pendingDeposits, icon: CreditCard, color: "bg-indigo-500" },
    { label: "Pending Withdrawals", value: stats.pendingWithdrawals, icon: Wallet, color: "bg-indigo-600" },
    { label: "Total Referrals", value: stats.totalReferrals, icon: GitBranch, color: "bg-cyan-500" },
    { label: "Password Resets", value: stats.pendingPasswordResets, icon: KeyRound, color: "bg-pink-500" },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-slate-900 px-6 py-7 text-white shadow-xl shadow-slate-900/10 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Operations overview</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-300">
          Total user balance: {formatCurrency(stats?.totalBalance || 0)}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="!p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                  <p className="text-xs text-slate-500">{card.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {stats ? <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Transaction flow" subtitle="Real activity across the last 14 days">
          <div className="flex h-48 items-end gap-1.5 border-b border-l border-slate-100 px-2 pb-1 pt-4">{stats.transactionChart.map((day) => { const max = Math.max(1, ...stats.transactionChart.flatMap((item) => [item.deposits, item.withdrawals])); return <div key={day.date} className="group flex h-full flex-1 items-end justify-center gap-0.5" title={`${day.date}: ${formatCurrency(day.deposits)} in, ${formatCurrency(day.withdrawals)} out`}><div className="w-2 rounded-t bg-[var(--brand-teal)] transition-all group-hover:opacity-75" style={{ height: `${Math.max(3, (day.deposits / max) * 100)}%` }} /><div className="w-2 rounded-t bg-[var(--brand-coral)] transition-all group-hover:opacity-75" style={{ height: `${Math.max(3, (day.withdrawals / max) * 100)}%` }} /></div>; })}</div>
          <div className="mt-3 flex gap-4 text-xs font-semibold text-slate-500"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[var(--brand-teal)]" /> Inflow</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[var(--brand-coral)]" /> Outflow</span></div>
        </Card>
        <Card title="Account health" subtitle="Current user status distribution">
          <div className="space-y-4">
            {[{ label: "Active users", value: stats.activeUsers, color: "bg-emerald-500" }, { label: "Frozen users", value: stats.frozenUsers, color: "bg-amber-500" }, { label: "Deactivated", value: stats.deactivatedUsers, color: "bg-red-500" }].map((item) => {
              const width = stats.totalUsers ? Math.max(4, (item.value / stats.totalUsers) * 100) : 4;
              return <div key={item.label}><div className="mb-1.5 flex justify-between text-sm"><span className="font-semibold text-slate-700">{item.label}</span><span className="font-bold text-slate-900">{item.value}</span></div><div className="h-2.5 rounded-full bg-slate-100"><div className={`h-full rounded-full ${item.color}`} style={{ width: `${width}%` }} /></div></div>;
            })}
          </div>
        </Card>
        <Card title="Work queue" subtitle="Items that need attention">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[{ label: "Payments", value: stats.pendingDeposits, color: "text-blue-700 bg-blue-50" }, { label: "Withdrawals", value: stats.pendingWithdrawals, color: "text-orange-700 bg-orange-50" }, { label: "Plans", value: stats.pendingPlans, color: "text-cyan-700 bg-cyan-50" }, { label: "Resets", value: stats.pendingPasswordResets, color: "text-fuchsia-700 bg-fuchsia-50" }].map((item) => <div key={item.label} className={`rounded-2xl p-4 ${item.color}`}><p className="text-2xl font-black">{item.value}</p><p className="mt-1 text-xs font-bold uppercase tracking-wide opacity-75">{item.label}</p></div>)}</div>
        </Card>
      </div> : <div className="grid gap-5 lg:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>}
    </div>
  );
}
