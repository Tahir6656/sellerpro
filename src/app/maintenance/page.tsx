"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wrench } from "lucide-react";

export default function MaintenancePage() {
  const [config, setConfig] = useState<{ message: string; endTime: string | null }>({
    message: "We are performing maintenance and will be back shortly.",
    endTime: null,
  });
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    fetch("/api/config/public")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setConfig({
            message: json.data.config.maintenance_message,
            endTime: json.data.config.maintenance_end || null,
          });
        }
      });
  }, []);

  useEffect(() => {
    if (!config.endTime) return;
    const interval = setInterval(() => {
      const diff = new Date(config.endTime!).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown("Maintenance should be ending soon...");
        clearInterval(interval);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s remaining`);
    }, 1000);
    return () => clearInterval(interval);
  }, [config.endTime]);

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-4">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6 animate-float">
          <Wrench className="w-10 h-10 text-amber-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Website Under Maintenance</h1>
        <p className="text-lg text-slate-600 mb-4">
          Please stay calm. We are performing maintenance and will be back shortly.
        </p>
        <p className="text-slate-500 mb-4">{config.message}</p>
        {countdown && (
          <p className="text-emerald-600 font-medium mb-6">{countdown}</p>
        )}
        <Link href="/login" className="text-sm text-emerald-600 hover:underline">
          Admin Login
        </Link>
      </div>
    </div>
  );
}
