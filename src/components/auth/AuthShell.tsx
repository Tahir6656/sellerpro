"use client";

import Link from "next/link";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="min-h-screen auth-bg relative flex items-center justify-center overflow-hidden p-4 sm:p-6">
      <div className="auth-orbit auth-orbit-one" aria-hidden="true" />
      <div className="auth-orbit auth-orbit-two" aria-hidden="true" />
      <div className="auth-grid" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md">
        <div className="auth-brand text-center mb-8">
          <Link href="/login" className="inline-flex items-center gap-3 justify-center">
            <span className="auth-brand-mark w-11 h-11 rounded-xl flex items-center justify-center text-slate-900 font-bold text-xl">
              S
            </span>
            <span className="text-3xl font-bold text-white tracking-tight">SellerPro</span>
          </Link>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
          <p className="text-slate-300 mt-1 text-sm">{subtitle}</p>
        </div>

        <div className="auth-form-card rounded-3xl p-6 lg:p-8">{children}</div>
        <p className="mt-6 text-center text-xs text-slate-400">Secure access to your SellerPro workspace</p>
      </div>
    </div>
  );
}

export function redirectAfterAuth(role: string) {
  window.location.replace(role === "ADMIN" ? "/admin" : "/dashboard/plans");
}
