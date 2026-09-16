"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, CalendarDays, CheckCircle, Clock3, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<{
    user: { username: string; email: string; mobile: string; accountStatus: string; registrationDate: string; lastLogin: string | null; referralCode: string };
    planHistory: { plan: { name: string }; amount: number; status: string; createdAt: string }[];
    depositHistory: { amount: number; status: string; createdAt: string; reviewedAt: string | null; rejectionReason: string | null; plan: { name: string } }[];
    withdrawalHistory: { amount: number; status: string; createdAt: string; reviewedAt: string | null; completedAt: string | null; txReference: string | null; adminNote: string | null; method: { name: string } }[];
    transactions: { id: string; type: string; amount: number; status: string; description: string | null; createdAt: string }[];
  } | null>(null);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState("ALL");
  const [transactionSearch, setTransactionSearch] = useState("");

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

  const filteredTransactions = (profile?.transactions || []).filter((transaction) => {
    const matchesType = transactionFilter === "ALL" || transaction.type === transactionFilter;
    const matchesSearch = !transactionSearch || `${transaction.description || ""} ${transaction.type}`.toLowerCase().includes(transactionSearch.toLowerCase());
    return matchesType && matchesSearch;
  });

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
            <div className="flex items-center gap-2"><span className="text-slate-500">Status:</span> <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{profile?.user.accountStatus}</span><CheckCircle className="h-4 w-4 text-blue-600" aria-label="Account verified" /></div>
            <div className="grid grid-cols-2 gap-3 border-t border-blue-50 pt-3 text-xs"><span className="flex items-center gap-1.5 text-slate-500"><CalendarDays className="h-3.5 w-3.5" /> Joined {profile?.user.registrationDate ? formatDate(profile.user.registrationDate) : "—"}</span><span className="flex items-center gap-1.5 text-slate-500"><Clock3 className="h-3.5 w-3.5" /> Last login {profile?.user.lastLogin ? formatDate(profile.user.lastLogin) : "—"}</span></div>
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
        <div className="mb-4 flex flex-col gap-2 sm:flex-row"><input value={transactionSearch} onChange={(event) => setTransactionSearch(event.target.value)} placeholder="Search transactions" className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white" /><select value={transactionFilter} onChange={(event) => setTransactionFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500"><option value="ALL">All activity</option><option value="DEPOSIT">Deposits</option><option value="WITHDRAWAL">Withdrawals</option><option value="REFERRAL_REWARD">Referral rewards</option><option value="PLAN_RETURN">Plan returns</option><option value="ADJUSTMENT">Adjustments</option></select></div>
        {filteredTransactions.length ? <div className="space-y-2">{filteredTransactions.map((transaction) => {
          const incoming = ["DEPOSIT", "PLAN_RETURN", "REFERRAL_REWARD", "REFUND", "ADJUSTMENT"].includes(transaction.type);
          return <div key={transaction.id} className="flex items-center gap-3 rounded-2xl border border-blue-50 bg-slate-50/70 p-3"><div className={`rounded-xl p-2 ${incoming ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}>{incoming ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-800">{transaction.description || transaction.type.replaceAll("_", " ")}</p><p className="text-xs text-slate-500">{formatDate(transaction.createdAt)} · {transaction.status}</p></div><p className={`text-sm font-bold ${incoming ? "text-emerald-600" : "text-slate-800"}`}>{incoming ? "+" : "-"}{formatCurrency(transaction.amount)}</p></div>;
        })}</div> : <p className="py-6 text-center text-sm text-slate-500">No matching transaction activity.</p>}
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Deposit History">
          <div className="space-y-2">
            {profile?.depositHistory?.map((h, i) => (
              <div key={i} className="rounded-2xl border border-blue-50 bg-slate-50 p-4 text-sm">
                <div className="flex justify-between gap-3"><div><p className="font-bold">{h.plan.name}</p><p className="text-xs text-slate-500">{formatCurrency(h.amount)} · submitted {formatDate(h.createdAt)}</p></div><span className={`rounded-full px-2 py-1 text-xs font-bold ${h.status === "APPROVED" ? "bg-emerald-50 text-emerald-700" : h.status === "REJECTED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{h.status}</span></div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4"><span className="text-emerald-700">✓ Submitted</span><span className={h.reviewedAt ? "text-blue-700" : "text-slate-400"}>{h.reviewedAt ? "✓ Reviewed" : "○ Under review"}</span><span className={h.status === "APPROVED" ? "text-emerald-700" : "text-slate-400"}>{h.status === "APPROVED" ? "✓ Approved" : "○ Approval"}</span><span className={h.status === "REJECTED" ? "text-red-600" : "text-slate-400"}>{h.status === "REJECTED" ? h.rejectionReason || "Rejected" : "○ Activated"}</span></div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Withdrawal History">
          <div className="space-y-2">
            {profile?.withdrawalHistory?.map((h, i) => (
              <div key={i} className="rounded-2xl border border-blue-50 bg-slate-50 p-4 text-sm">
                <div className="flex justify-between gap-3"><div><p className="font-bold">{h.method.name}</p><p className="text-xs text-slate-500">{formatCurrency(h.amount)} · requested {formatDate(h.createdAt)}</p></div><span className={`rounded-full px-2 py-1 text-xs font-bold ${h.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : h.status === "REJECTED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{h.status}</span></div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4"><span className="text-emerald-700">✓ Requested</span><span className={h.reviewedAt ? "text-blue-700" : "text-slate-400"}>{h.reviewedAt ? "✓ Reviewed" : "○ Review"}</span><span className={h.status === "APPROVED" || h.status === "COMPLETED" ? "text-blue-700" : "text-slate-400"}>{h.status === "APPROVED" || h.status === "COMPLETED" ? "✓ Approved" : "○ Approved"}</span><span className={h.status === "COMPLETED" ? "text-emerald-700" : h.status === "REJECTED" ? "text-red-600" : "text-slate-400"}>{h.status === "COMPLETED" ? "✓ Completed" : h.status === "REJECTED" ? h.adminNote || "Rejected" : "○ Completed"}</span></div>
                {h.txReference && <p className="mt-3 border-t border-blue-100 pt-2 text-xs text-slate-500">Transaction reference: <strong className="text-slate-800">{h.txReference}</strong></p>}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
