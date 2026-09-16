"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<{
    user: { username: string; email: string; mobile: string };
    planHistory: { plan: { name: string }; amount: number; status: string; createdAt: string }[];
    depositHistory: { amount: number; status: string; createdAt: string; plan: { name: string } }[];
    withdrawalHistory: { amount: number; status: string; createdAt: string; method: { name: string } }[];
    transactions: { id: string; type: string; amount: number; status: string; description: string | null; createdAt: string }[];
  } | null>(null);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((json) => { if (json.success) setProfile(json.data); });
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwords),
      });
      const json = await res.json();
      if (json.success) {
        toast("Password updated successfully", "success");
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toast(json.error || "Update failed", "error");
      }
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n);

  const formatDate = (d: string) =>
    new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-slate-900 px-6 py-7 text-white shadow-xl shadow-slate-900/10 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Account center</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-slate-300">Manage your account and review your account activity.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Personal Information">
          <div className="mb-5 flex items-center gap-3 rounded-2xl bg-blue-50 p-4"><div className="rounded-xl bg-blue-600 p-2 text-white"><UserRound className="h-5 w-5" /></div><div><p className="font-bold text-slate-900">Account profile</p><p className="text-xs text-slate-500">Your verified account details</p></div><ShieldCheck className="ml-auto h-5 w-5 text-emerald-600" /></div>
          <div className="space-y-3 text-sm">
            <div><span className="text-slate-500">Username:</span> <strong>{profile?.user.username}</strong></div>
            <div><span className="text-slate-500">Email:</span> <strong>{profile?.user.email}</strong></div>
            <div><span className="text-slate-500">Mobile:</span> <strong>{profile?.user.mobile}</strong></div>
          </div>
        </Card>

        <Card title="Change Password">
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800"><LockKeyhole className="h-4 w-4" /> Use a strong password you do not reuse elsewhere.</div>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input label="Current Password" type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} required />
            <Input label="New Password" type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} required />
            <Input label="Confirm New Password" type="password" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} required />
            <Button type="submit" loading={loading}>Update Password</Button>
          </form>
        </Card>
      </div>

      <Card title="Plan History">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500">
              <th className="pb-2 pr-4">Plan</th><th className="pb-2 pr-4">Amount</th><th className="pb-2 pr-4">Date</th><th className="pb-2">Status</th>
            </tr></thead>
            <tbody>
              {profile?.planHistory?.map((h, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-2 pr-4">{h.plan.name}</td>
                  <td className="py-2 pr-4">{formatCurrency(h.amount)}</td>
                  <td className="py-2 pr-4">{formatDate(h.createdAt)}</td>
                  <td className="py-2"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs">{h.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Transaction activity" subtitle="Your recorded wallet movements and status history">
        {profile?.transactions?.length ? <div className="space-y-2">{profile.transactions.map((transaction) => {
          const incoming = ["DEPOSIT", "PLAN_RETURN", "REFERRAL_REWARD", "REFUND", "ADJUSTMENT"].includes(transaction.type);
          return <div key={transaction.id} className="flex items-center gap-3 rounded-2xl border border-blue-50 bg-slate-50/70 p-3"><div className={`rounded-xl p-2 ${incoming ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}>{incoming ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-800">{transaction.description || transaction.type.replaceAll("_", " ")}</p><p className="text-xs text-slate-500">{formatDate(transaction.createdAt)} · {transaction.status}</p></div><p className={`text-sm font-bold ${incoming ? "text-emerald-600" : "text-slate-800"}`}>{incoming ? "+" : "-"}{formatCurrency(transaction.amount)}</p></div>;
        })}</div> : <p className="py-6 text-center text-sm text-slate-500">No transaction activity yet.</p>}
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Deposit History">
          <div className="space-y-2">
            {profile?.depositHistory?.map((h, i) => (
              <div key={i} className="flex justify-between p-3 bg-slate-50 rounded-xl text-sm">
                <div><p className="font-medium">{h.plan.name}</p><p className="text-slate-500">{formatDate(h.createdAt)}</p></div>
                <div className="text-right"><p>{formatCurrency(h.amount)}</p><p className="text-xs text-slate-500">{h.status}</p></div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Withdrawal History">
          <div className="space-y-2">
            {profile?.withdrawalHistory?.map((h, i) => (
              <div key={i} className="flex justify-between p-3 bg-slate-50 rounded-xl text-sm">
                <div><p className="font-medium">{h.method.name}</p><p className="text-slate-500">{formatDate(h.createdAt)}</p></div>
                <div className="text-right"><p>{formatCurrency(h.amount)}</p><p className="text-xs text-slate-500">{h.status}</p></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
