"use client";

import { useEffect, useState } from "react";
import { Copy, CheckCircle, XCircle, Gift, Users, WalletCards } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface TreeNode {
  id: string;
  username: string;
  accountStatus: string;
  planStatus: string;
  isVerified: boolean;
  isEligible: boolean;
  rewardPaid: boolean;
  children: TreeNode[];
}

function TreeView({ nodes, depth = 0 }: { nodes: TreeNode[]; depth?: number }) {
  if (nodes.length === 0) return null;
  return (
    <ul className={depth > 0 ? "ml-6 border-l border-slate-200 pl-4" : ""}>
      {nodes.map((node) => (
        <li key={node.id} className="py-2">
          <div className="flex items-center gap-2 text-sm">
            {node.planStatus === "APPROVED" ? (
              <CheckCircle className="w-4 h-4 text-blue-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400" />
            )}
            <span className="font-medium">{node.username}</span>
            <span className="text-xs text-slate-400">({node.accountStatus})</span>
          </div>
          <TreeView nodes={node.children} depth={depth + 1} />
        </li>
      ))}
    </ul>
  );
}

function countTreeNodes(nodes: TreeNode[]): { total: number; active: number; eligible: number; paid: number } {
  return nodes.reduce((summary, node) => {
    const childSummary = countTreeNodes(node.children);
    return {
      total: summary.total + 1 + childSummary.total,
      active: summary.active + (node.planStatus === "APPROVED" ? 1 : 0) + childSummary.active,
      eligible: summary.eligible + (node.isEligible ? 1 : 0) + childSummary.eligible,
      paid: summary.paid + (node.rewardPaid ? 1 : 0) + childSummary.paid,
    };
  }, { total: 0, active: 0, eligible: 0, paid: 0 });
}

export default function ReferralsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<{
    referralLink: string;
    referralEarnings: number;
    directReferrals: { username: string; accountStatus: string; registrationDate: string; activePlan: { status: string } | null }[];
    tree: TreeNode[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    fetch("/api/user/referrals")
      .then((r) => r.json())
      .then((json) => { if (json.success) setData(json.data); else setLoadError(json.error || "Could not load referrals"); })
      .catch(() => setLoadError("Could not load referrals. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  const copyLink = () => {
    if (data?.referralLink) {
      navigator.clipboard.writeText(data.referralLink);
      toast("Referral link copied!", "success");
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n);
  const treeSummary = countTreeNodes(data?.tree || []);

  return (
    <div className="space-y-6">
      {loading && <div className="h-32 animate-pulse rounded-3xl bg-white/70" />}
      {loadError && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError}</div>}
      <div className="rounded-3xl bg-slate-900 px-6 py-7 text-white shadow-xl shadow-slate-900/10 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Partner network</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Referrals</h1>
        <p className="mt-1 text-sm text-slate-300">Share your link, grow your network, and track eligible rewards.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Network members", value: treeSummary.total, icon: Users, tone: "bg-blue-50 text-blue-700" },
          { label: "Active plans", value: treeSummary.active, icon: CheckCircle, tone: "bg-emerald-50 text-emerald-700" },
          { label: "Reward eligible", value: treeSummary.eligible, icon: Gift, tone: "bg-amber-50 text-amber-700" },
          { label: "Rewards paid", value: treeSummary.paid, icon: WalletCards, tone: "bg-fuchsia-50 text-fuchsia-700" },
        ].map((stat) => { const Icon = stat.icon; return <div key={stat.label} className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm"><div className={`mb-3 w-fit rounded-xl p-2 ${stat.tone}`}><Icon className="h-4 w-4" /></div><p className="text-xl font-black text-slate-900">{stat.value}</p><p className="mt-1 text-xs text-slate-500">{stat.label}</p></div>; })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Your Referral Link">
          <div className="flex gap-2">
            <input
              readOnly
              value={data?.referralLink || ""}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
            />
            <Button onClick={copyLink} size="sm"><Copy className="w-4 h-4" /></Button>
          </div>
          <p className="text-sm text-slate-500 mt-3">
            Total referral earnings: <strong>{formatCurrency(data?.referralEarnings || 0)}</strong>
          </p>
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-3 text-xs leading-5 text-blue-900">
            Rewards become eligible when a referred user has an approved active plan and the referral verification is complete. The amount shown above is recorded referral income.
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-blue-500" /> Verified/Eligible</span>
            <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-400" /> Not eligible</span>
          </div>
        </Card>

        <Card title="Direct Referrals" subtitle={`${data?.directReferrals?.length || 0} referrals`}>
          {data?.directReferrals?.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No referrals yet</p>
          ) : (
            <div className="space-y-2">
              {data?.directReferrals?.map((r, i) => (
                <div key={i} className="flex justify-between p-3 bg-slate-50 rounded-xl text-sm">
                  <span className="font-medium">{r.username}</span>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${r.activePlan?.status === "APPROVED" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{r.activePlan?.status === "APPROVED" ? "Active plan" : r.accountStatus}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Referral Tree">
        {data?.tree && data.tree.length > 0 ? (
          <TreeView nodes={data.tree} />
        ) : (
          <p className="text-slate-500 text-sm text-center py-8">No referral tree data yet</p>
        )}
      </Card>
    </div>
  );
}
