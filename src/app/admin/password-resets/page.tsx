"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";

interface ResetRequest {
  id: string;
  status: string;
  createdAt: string;
  user: { username: string; email: string; mobile: string };
}

export default function AdminPasswordResetsPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchData = () => {
    fetch("/api/admin/password-resets").then((r) => r.json()).then((json) => {
      if (json.success) setRequests(json.data);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (requestId: string, action: string) => {
    const res = await fetch("/api/admin/password-resets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action, rejectionReason: rejectionReason || undefined }),
    });
    const json = await res.json();
    toast(json.data?.message || json.error || "Done", json.success ? "success" : "error");
    if (json.success) { setRejecting(null); setRejectionReason(""); fetchData(); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Password Reset Requests</h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Mobile</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="py-3 pr-4 font-medium">{r.user.username}</td>
                  <td className="py-3 pr-4">{r.user.email}</td>
                  <td className="py-3 pr-4">{r.user.mobile}</td>
                  <td className="py-3 pr-4">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs">{r.status}</span>
                  </td>
                  <td className="py-3">
                    {r.status === "PENDING" && (
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => handleAction(r.id, "approve")}>Approve</Button>
                        <Button size="sm" variant="danger" onClick={() => setRejecting(r.id)}>Reject</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal isOpen={!!rejecting} onClose={() => setRejecting(null)} title="Reject password reset">
        <div className="space-y-4"><Input label="Rejection reason (optional)" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} /><div className="flex gap-3"><Button variant="ghost" className="flex-1" onClick={() => setRejecting(null)}>Cancel</Button><Button variant="danger" className="flex-1" onClick={() => rejecting && handleAction(rejecting, "reject")}>Reject</Button></div></div>
      </Modal>
    </div>
  );
}
