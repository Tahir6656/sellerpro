"use client";

import { useEffect, useState } from "react";
import { Copy, CheckCircle, XCircle } from "lucide-react";
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
  children: TreeNode[];
}

function TreeView({ nodes, depth = 0 }: { nodes: TreeNode[]; depth?: number }) {
  if (nodes.length === 0) return null;
  return (
    <ul className={depth > 0 ? "ml-6 border-l border-slate-200 pl-4" : ""}>
      {nodes.map((node) => (
        <li key={node.id} className="py-2">
          <div className="flex items-center gap-2 text-sm">
            {node.isEligible ? (
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

export default function ReferralsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<{
    referralLink: string;
    referralEarnings: number;
    directReferrals: { username: string; accountStatus: string; registrationDate: string }[];
    tree: TreeNode[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/user/referrals")
      .then((r) => r.json())
      .then((json) => { if (json.success) setData(json.data); });
  }, []);

  const copyLink = () => {
    if (data?.referralLink) {
      navigator.clipboard.writeText(data.referralLink);
      toast("Referral link copied!", "success");
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Referrals</h1>
        <p className="text-slate-500 mt-1">Share your link and earn rewards</p>
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
                  <span className="text-slate-500">{r.accountStatus}</span>
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
