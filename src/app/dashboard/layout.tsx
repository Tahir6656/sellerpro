"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  CreditCard,
  Wallet,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  HelpCircle,
} from "lucide-react";
import Button from "@/components/ui/Button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/plans", label: "Plans", icon: CreditCard },
  { href: "/dashboard/withdraw", label: "Withdraw", icon: Wallet },
  { href: "/dashboard/referrals", label: "Referrals", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/support", label: "Contact us", icon: HelpCircle },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen flex dashboard-bg">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0b1f3a] text-white transform transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-[#203b60]">
          <Link href="/dashboard" className="text-xl font-bold tracking-tight text-amber-300">
            SellerPro
          </Link>
          <button className="lg:hidden" onClick={() => setMobileOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-950/20"
                    : "text-slate-300 hover:bg-[#102d52] hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#203b60]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-300 hover:bg-[#102d52] hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex-1 lg:ml-64">
        <header className="dashboard-header sticky top-0 z-20 px-4 lg:px-8 py-4 flex items-center justify-between">
          <button className="rounded-lg p-2 text-slate-200 hover:bg-white/10 lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <Link href="/dashboard" className="rounded-lg p-2 hover:bg-white/10" aria-label="Dashboard notifications">
              <Bell className="w-5 h-5 text-slate-200" />
            </Link>
          </div>
        </header>
        <main className="dashboard-main min-h-[calc(100vh-73px)] p-3 pb-24 sm:p-5 sm:pb-24 lg:p-8 lg:pb-8">{children}</main>
        <nav className="dashboard-mobile-nav fixed inset-x-3 bottom-3 z-30 flex items-center justify-around rounded-3xl border border-white/80 bg-white/90 p-2 shadow-xl shadow-slate-900/15 backdrop-blur-xl lg:hidden">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex min-w-14 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-semibold transition ${active ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-slate-500 hover:bg-blue-50 hover:text-blue-600"}`}>
                <Icon className="h-4 w-4" />
                {item.label === "Dashboard" ? "Home" : item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
