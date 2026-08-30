"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const CONFIG_FIELDS = [
  { key: "welcome_title", label: "Welcome Title", type: "text" },
  { key: "welcome_subtitle", label: "Welcome Subtitle", type: "text" },
  { key: "welcome_hero", label: "Hero Text", type: "textarea" },
  { key: "dashboard_description", label: "Dashboard Description", type: "textarea" },
  { key: "how_it_works_text", label: "How It Works Text", type: "textarea" },
  { key: "how_it_works_audio", label: "How It Works Audio URL", type: "text" },
  { key: "how_it_works_video", label: "How It Works Video URL", type: "text" },
  { key: "announcement", label: "Announcement", type: "textarea" },
  { key: "referral_reward_amount", label: "Referral Reward Amount", type: "text" },
  { key: "min_withdrawal", label: "Min Withdrawal", type: "text" },
  { key: "max_withdrawal", label: "Max Withdrawal", type: "text" },
  { key: "maintenance_enabled", label: "Maintenance Mode (true/false)", type: "text" },
  { key: "maintenance_message", label: "Maintenance Message", type: "textarea" },
  { key: "maintenance_end", label: "Maintenance End (ISO date)", type: "text" },
];

export default function AdminConfigPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/config").then((r) => r.json()).then((json) => {
      if (json.success) setConfig(json.data);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    const json = await res.json();
    toast(json.data?.message || json.error || "Failed", json.success ? "success" : "error");
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">System Configuration</h1>
        <Button loading={saving} onClick={handleSave}>Save All</Button>
      </div>

      <Card>
        <div className="space-y-5">
          {CONFIG_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{field.label}</label>
              {field.type === "textarea" ? (
                <textarea
                  value={config[field.key] || ""}
                  onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                  rows={3}
                />
              ) : (
                <input
                  type="text"
                  value={config[field.key] || ""}
                  onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
