"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import EmptyState from "@/components/ui/EmptyState";
import { Layers } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  slug: string;
  products: number;
  durationDays: number;
  investment: number;
  statedReturn: number;
  isActive: boolean;
  isVisible: boolean;
  sortOrder: number;
}

const emptyPlan = {
  name: "", slug: "", products: 10, durationDays: 3,
  investment: 300, statedReturn: 500, isActive: true, isVisible: true, sortOrder: 0,
};

export default function AdminPlansPage() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editing, setEditing] = useState<Partial<Plan> | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchPlans = () => {
    fetch("/api/admin/plans").then((r) => r.json()).then((json) => {
      if (json.success) setPlans(json.data);
    });
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const isNew = !editing.id;
    const res = await fetch("/api/admin/plans", {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    const json = await res.json();
    toast(json.data?.name ? "Plan saved" : json.error || "Failed", json.success ? "success" : "error");
    if (json.success) { setEditing(null); fetchPlans(); }
    setSaving(false);
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Plan Management</h1>
        <Button size="sm" onClick={() => setEditing({ ...emptyPlan })}>Add Plan</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Products</th>
                <th className="pb-3 pr-4">Duration</th>
                <th className="pb-3 pr-4">Investment</th>
                <th className="pb-3 pr-4">Return</th>
                <th className="pb-3 pr-4">Active</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id} className="border-b border-slate-50">
                  <td className="py-3 pr-4 font-medium">{p.name}</td>
                  <td className="py-3 pr-4">{p.products}</td>
                  <td className="py-3 pr-4">{p.durationDays}d</td>
                  <td className="py-3 pr-4">{formatCurrency(p.investment)}</td>
                  <td className="py-3 pr-4">{formatCurrency(p.statedReturn)}</td>
                  <td className="py-3 pr-4">{p.isActive ? "Yes" : "No"}</td>
                  <td className="py-3">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!plans.length && <EmptyState title="No plans yet" description="Create the first selling plan to make it available to users." icon={<Layers className="h-5 w-5" />} action={<Button size="sm" onClick={() => setEditing({ ...emptyPlan })}>Add plan</Button>} />}
        </div>
      </Card>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Plan" : "Add Plan"} size="lg">
        {editing && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Name" value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <Input label="Slug" value={editing.slug || ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
            <Input label="Products" type="number" value={editing.products || ""} onChange={(e) => setEditing({ ...editing, products: parseInt(e.target.value) })} />
            <Input label="Duration (days)" type="number" value={editing.durationDays || ""} onChange={(e) => setEditing({ ...editing, durationDays: parseInt(e.target.value) })} />
            <Input label="Investment" type="number" value={editing.investment || ""} onChange={(e) => setEditing({ ...editing, investment: parseFloat(e.target.value) })} />
            <Input label="Stated Return" type="number" value={editing.statedReturn || ""} onChange={(e) => setEditing({ ...editing, statedReturn: parseFloat(e.target.value) })} />
            <Input label="Sort Order" type="number" value={editing.sortOrder || 0} onChange={(e) => setEditing({ ...editing, sortOrder: parseInt(e.target.value) })} />
            <div className="flex items-center gap-4 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.isVisible} onChange={(e) => setEditing({ ...editing, isVisible: e.target.checked })} />
                Visible
              </label>
            </div>
            <Button className="sm:col-span-2" loading={saving} onClick={handleSave}>Save Plan</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
