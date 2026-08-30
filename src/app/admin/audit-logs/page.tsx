"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";

interface AuditLog {
  id: string;
  action: string;
  previousValue: string | null;
  newValue: string | null;
  createdAt: string;
  admin: { username: string };
  targetUser: { username: string } | null;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    fetch("/api/admin/audit-logs").then((r) => r.json()).then((json) => {
      if (json.success) setLogs(json.data);
    });
  }, []);

  const formatDate = (d: string) =>
    new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Admin</th>
                <th className="pb-3 pr-4">Action</th>
                <th className="pb-3 pr-4">Target</th>
                <th className="pb-3 pr-4">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-50">
                  <td className="py-3 pr-4 text-slate-500">{formatDate(log.createdAt)}</td>
                  <td className="py-3 pr-4">{log.admin.username}</td>
                  <td className="py-3 pr-4">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs font-medium">{log.action}</span>
                  </td>
                  <td className="py-3 pr-4">{log.targetUser?.username || "—"}</td>
                  <td className="py-3 pr-4 text-slate-500 max-w-xs truncate">
                    {log.newValue || log.previousValue || "—"}
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
