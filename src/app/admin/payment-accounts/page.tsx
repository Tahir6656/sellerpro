"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface PaymentAccount {
  id: string;
  methodName: string;
  accountHolder: string;
  accountNumber: string;
  mobileId: string | null;
  instructions: string | null;
  isActive: boolean;
}

export default function AdminPaymentAccountsPage() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [editing, setEditing] = useState<Partial<PaymentAccount> | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchAccounts = () => {
    fetch("/api/admin/payment-accounts").then((r) => r.json()).then((json) => {
      if (json.success) setAccounts(json.data);
    });
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const isNew = !editing.id;
    const res = await fetch("/api/admin/payment-accounts", {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    const json = await res.json();
    toast(json.success ? "Account saved" : json.error || "Failed", json.success ? "success" : "error");
    if (json.success) { setEditing(null); fetchAccounts(); }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Payment Accounts</h1>
        <Button size="sm" onClick={() => setEditing({ methodName: "", accountHolder: "", accountNumber: "", isActive: true })}>Add Account</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {accounts.map((a) => (
          <Card key={a.id}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{a.methodName}</h3>
                <p className="text-sm text-slate-600 mt-1">{a.accountHolder}</p>
                <p className="text-sm font-mono">{a.accountNumber}</p>
                {a.instructions && <p className="text-xs text-slate-500 mt-2">{a.instructions}</p>}
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs ${a.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                {a.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <Button size="sm" variant="ghost" className="mt-3" onClick={() => setEditing(a)}>Edit</Button>
          </Card>
        ))}
      </div>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Account" : "Add Account"}>
        {editing && (
          <div className="space-y-4">
            <Input label="Method Name" value={editing.methodName || ""} onChange={(e) => setEditing({ ...editing, methodName: e.target.value })} />
            <Input label="Account Holder" value={editing.accountHolder || ""} onChange={(e) => setEditing({ ...editing, accountHolder: e.target.value })} />
            <Input label="Account Number" value={editing.accountNumber || ""} onChange={(e) => setEditing({ ...editing, accountNumber: e.target.value })} />
            <Input label="Mobile ID" value={editing.mobileId || ""} onChange={(e) => setEditing({ ...editing, mobileId: e.target.value })} />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Instructions</label>
              <textarea
                value={editing.instructions || ""}
                onChange={(e) => setEditing({ ...editing, instructions: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                rows={3}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
              Active
            </label>
            <Button className="w-full" loading={saving} onClick={handleSave}>Save</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
