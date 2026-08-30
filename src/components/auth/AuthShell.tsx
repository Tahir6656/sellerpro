"use client";

import Link from "next/link";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="min-h-screen auth-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/login" className="inline-flex items-center gap-3 justify-center">
            <span className="w-11 h-11 rounded-xl bg-amber-400 flex items-center justify-center text-slate-900 font-bold text-xl">
              S
            </span>
            <span className="text-3xl font-bold text-white tracking-tight">SellerPro</span>
          </Link>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-white">{title}</h1>
          <p className="text-slate-300 mt-1 text-sm">{subtitle}</p>
        </div>

        <div className="auth-form-card rounded-2xl p-6 lg:p-8 shadow-xl">{children}</div>
      </div>
    </div>
  );
}

export function redirectAfterAuth(role: string) {
  window.location.replace(role === "ADMIN" ? "/admin" : "/dashboard/plans");
}
