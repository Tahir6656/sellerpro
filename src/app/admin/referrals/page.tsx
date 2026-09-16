"use client";

import { useEffect, useState } from "react";
import { CheckCircle, ChevronDown, ChevronRight, GitBranch, XCircle } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface Verification {
  id: string;
  isVerified: boolean;
  rewardPaid: boolean;
  rewardAmount: number;
  referrer: { username: string };
  referred: { username: string; accountStatus: string; activePlan: { status: string } | null };
}

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

function ReferralTreeNode({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const hasActivePlan = node.planStatus === "APPROVED";

  return (
    <div className={depth > 0 ? "ml-4 border-l border-blue-100 pl-4 sm:ml-7" : ""}>
      <div className="group relative flex items-center gap-3 rounded-2xl border border-blue-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
        {hasChildren ? (
          <button type="button" onClick={() => setExpanded((value) => !value)} className="rounded-lg p-1 text-slate-400 hover:bg-blue-50 hover:text-blue-600" aria-label={expanded ? "Collapse referrals" : "Expand referrals"}>
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : <span className="w-6" />}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
          {node.username.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{node.username}</p>
          <p className="text-xs text-slate-500">{node.accountStatus} · {hasChildren ? `${node.children.length} referral${node.children.length === 1 ? "" : "s"}` : "No direct referrals"}</p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${hasActivePlan ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`} title={hasActivePlan ? "Active approved plan" : "No active approved plan"}>
          {hasActivePlan ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{hasActivePlan ? "Active plan" : "No active plan"}</span>
        </span>
      </div>
      {expanded && hasChildren && (
        <div className="mt-3 space-y-3">
          {node.children.map((child) => <ReferralTreeNode key={child.id} node={child} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
}

export default function AdminReferralsPage() {
  const { toast } = useToast();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [tree, setTree] = useState<TreeNode[]>([]);

  const fetchData = () => {
    fetch("/api/admin/referrals?view=tree").then((r) => r.json()).then((json) => {
      if (json.success) {
        setVerifications(json.data.verifications);
        setTree(json.data.tree);
      }
    });
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (verificationId: string, action: string) => {
    const res = await fetch("/api/admin/referrals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verificationId, action }),
    });
    const json = await res.json();
    toast(json.data?.message || json.error || "Done", json.success ? "success" : "error");
    if (json.success) fetchData();
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-600 p-3 text-white shadow-lg shadow-blue-600/20"><GitBranch className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Referral Management</h1>
            <p className="mt-1 text-sm text-slate-500">Inspect every referral level and active plan status.</p>
          </div>
        </div>
      </div>

      <Card title="Complete referral tree" subtitle="Relationships are built from each user&apos;s stored referrer and may span multiple levels.">
        {tree.length > 0 ? (
          <div className="space-y-3">
            {tree.map((node) => <ReferralTreeNode key={node.id} node={node} />)}
            <div className="flex flex-wrap gap-4 border-t border-blue-50 pt-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-blue-600" /> Active approved plan</span>
              <span className="flex items-center gap-1.5"><XCircle className="h-4 w-4 text-slate-400" /> No active approved plan</span>
            </div>
          </div>
        ) : <p className="py-8 text-center text-sm text-slate-500">No referral relationships found.</p>}
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-3 pr-4">Referrer</th>
                <th className="pb-3 pr-4">Referred</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Reward</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {verifications.map((v) => (
                <tr key={v.id} className="border-b border-slate-50">
                  <td className="py-3 pr-4 font-medium">{v.referrer.username}</td>
                  <td className="py-3 pr-4">{v.referred.username}</td>
                  <td className="py-3 pr-4">
                    {v.isVerified ? (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {v.rewardPaid ? `Paid (${v.rewardAmount})` : "Pending"}
                  </td>
                  <td className="py-3">
                    {!v.isVerified && (
                      <Button size="sm" onClick={() => handleAction(v.id, "verify")}>Verify</Button>
                    )}
                    {v.isVerified && (
                      <Button size="sm" variant="ghost" onClick={() => handleAction(v.id, "unverify")}>Unverify</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
