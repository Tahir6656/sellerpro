"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; isRead: boolean; createdAt: string }[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    const response = await fetch("/api/notifications");
    const json = await response.json();
    if (json.success) setNotifications(json.data.notifications);
  };

  useEffect(() => { loadNotifications(); }, []);

  const markNotificationRead = async (id: string) => {
    await fetch("/api/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setNotifications((current) => current.map((notification) => notification.id === id ? { ...notification, isRead: true } : notification));
  };

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
                    ? "bg-[var(--brand-teal)] text-white shadow-lg shadow-teal-950/20"
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
          <div className="relative ml-auto" ref={notificationRef}>
            <button type="button" onClick={() => setNotificationsOpen((open) => !open)} className="relative rounded-xl p-2 text-slate-200 hover:bg-white/10" aria-label={`Notifications${notifications.some((notification) => !notification.isRead) ? " with unread items" : ""}`}>
              <Bell className="w-5 h-5 text-[var(--brand-gold)]" />
                {notifications.some((notification) => !notification.isRead) && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-[var(--brand-coral)] ring-2 ring-[#0b1f3a]" />}
            </button>
            {notificationsOpen && <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-blue-50 px-4 py-3"><div><p className="font-bold text-slate-900">Notifications</p><p className="text-xs text-slate-500">{notifications.filter((notification) => !notification.isRead).length} unread</p></div><Bell className="h-4 w-4 text-blue-600" /></div><div className="max-h-80 overflow-y-auto">{notifications.length ? notifications.map((notification) => <button key={notification.id} type="button" onClick={() => !notification.isRead && markNotificationRead(notification.id)} className={`w-full border-b border-slate-50 px-4 py-3 text-left transition hover:bg-blue-50 ${notification.isRead ? "bg-white" : "bg-blue-50/60"}`}><div className="flex items-start gap-2"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.isRead ? "bg-slate-300" : "bg-blue-600"}`} /><div><p className="text-sm font-semibold text-slate-900">{notification.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{notification.message}</p></div></div></button>) : <p className="p-5 text-center text-sm text-slate-500">You are all caught up.</p>}</div></div>}
          </div>
        </header>
        <main className="dashboard-main min-h-[calc(100vh-73px)] p-3 pb-24 sm:p-5 sm:pb-24 lg:p-8 lg:pb-8">{children}</main>
        <footer className="dashboard-footer hidden border-t border-blue-100 bg-white/70 px-4 py-4 text-center text-xs text-slate-500 lg:block lg:pl-72 lg:text-left">
          <div className="flex flex-wrap gap-x-4 gap-y-2"><span className="font-semibold text-slate-700">SellerPro</span><Link href="/about" className="hover:text-blue-600">About</Link><Link href="/terms" className="hover:text-blue-600">Terms</Link><Link href="/privacy" className="hover:text-blue-600">Privacy</Link><Link href="/withdrawal-policy" className="hover:text-blue-600">Withdrawal policy</Link><Link href="/referral-eligibility" className="hover:text-blue-600">Referral eligibility</Link><Link href="/payment-instructions" className="hover:text-blue-600">Payment instructions</Link></div>
        </footer>
        <nav className="dashboard-mobile-nav fixed inset-x-3 bottom-3 z-30 flex items-center justify-around rounded-3xl border border-white/80 bg-white/90 p-2 shadow-xl shadow-slate-900/15 backdrop-blur-xl lg:hidden">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex min-w-14 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-semibold transition ${active ? "bg-[var(--brand-teal)] text-white shadow-md shadow-teal-600/20" : "text-slate-500 hover:bg-emerald-50 hover:text-[var(--brand-teal)]"}`}>
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
