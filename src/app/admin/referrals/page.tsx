"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
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

export default function AdminReferralsPage() {
  const { toast } = useToast();
  const [verifications, setVerifications] = useState<Verification[]>([]);

  const fetchData = () => {
    fetch("/api/admin/referrals").then((r) => r.json()).then((json) => {
      if (json.success) setVerifications(json.data);
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
      <h1 className="text-2xl font-bold text-slate-900">Referral Management</h1>
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
