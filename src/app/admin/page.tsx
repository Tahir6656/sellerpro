"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, CreditCard, Wallet, Layers, GitBranch, KeyRound } from "lucide-react";
import Card from "@/components/ui/Card";
import { useSSE } from "@/hooks/useApi";

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
    { label: "Active Users", value: stats.activeUsers, icon: Users, color: "bg-emerald-500" },
    { label: "Frozen Users", value: stats.frozenUsers, icon: Users, color: "bg-amber-500" },
    { label: "Deactivated", value: stats.deactivatedUsers, icon: Users, color: "bg-red-500" },
    { label: "Active Plans", value: stats.activePlans, icon: Layers, color: "bg-teal-500" },
    { label: "Pending Plans", value: stats.pendingPlans, icon: Layers, color: "bg-orange-500" },
    { label: "Pending Deposits", value: stats.pendingDeposits, icon: CreditCard, color: "bg-indigo-500" },
    { label: "Pending Withdrawals", value: stats.pendingWithdrawals, icon: Wallet, color: "bg-purple-500" },
    { label: "Total Referrals", value: stats.totalReferrals, icon: GitBranch, color: "bg-cyan-500" },
    { label: "Password Resets", value: stats.pendingPasswordResets, icon: KeyRound, color: "bg-pink-500" },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">
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
    </div>
  );
}
