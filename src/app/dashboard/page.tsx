"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  CreditCard,
  Clock,
  HelpCircle,
  AlertTriangle,
  Bell,
  Copy,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowUpRight,
  Gift,
  Headphones,
  ShieldCheck,
  Sparkles,
  Users,
  ArrowRight,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Link from "next/link";
import { useSSE } from "@/hooks/useApi";

interface DashboardData {
  user: {
    username: string;
    balance: number;
    accountStatus: string;
    referralCode: string;
  };
  activePlan: {
    id: string;
    plan: { name: string; investment: number; durationDays: number; statedReturn: number };
    startDate: string;
    endDate: string;
    status: string;
  } | null;
  activePlans: Array<{
    id: string;
    plan: { name: string; investment: number; durationDays: number; statedReturn: number };
    startDate: string;
    endDate: string;
    status: string;
  }>;
  pendingPlan: { plan: { name: string }; createdAt: string; status: string } | null;
  pendingPayment: { plan: { name: string }; createdAt: string } | null;
  summary: {
    totalDeposits: number;
    depositCount: number;
    totalWithdrawals: number;
    withdrawalCount: number;
    pendingWithdrawals: number;
    referralEarnings: number;
  };
}

const BASIC_TASK_LINKS = [
  "https://kitchenaree.myshopify.com/products/portable-blender",
  "https://speedygadgets.store/products/portable-electric-juicer-blender-usb-mini-fruit-blender-juicer",
  "https://example-store.myshopify.com/products/wireless-earbuds",
  "https://example-store.myshopify.com/products/smart-watch",
  "https://example-store.myshopify.com/products/mini-vacuum-cleaner",
  "https://example-store.myshopify.com/products/led-desk-lamp",
  "https://example-store.myshopify.com/products/car-phone-holder",
  "https://example-store.myshopify.com/products/portable-humidifier",
  "https://example-store.myshopify.com/products/usb-rechargeable-fan",
  "https://example-store.myshopify.com/products/bluetooth-speaker",
];

const STANDARD_TASK_LINKS = [
  "https://sonet-appliances.myshopify.com/products/portable-blender",
  "https://newcomer-shop.myshopify.com/products/portable-blender-1",
  "https://the-perfect-pair-7785.myshopify.com/products/portable-blender",
  "https://techy-mart-store.myshopify.com/products/portable-blender-for-shakes-and-juice",
  "https://aurevino.myshopify.com/products/portable-blender",
  "https://smartchoicepvtltd.myshopify.com/products/mini-portable-blender-electric-juicer-fruit-mixers-fruit-extractors-smoothies-mixer-multifunctional-juice-maker-machine-blender",
  "https://novanest-11731.myshopify.com/products/portable-blender",
  "https://sydorastore.myshopify.com/products/electric-portable-mini-blender",
  "https://danvy-3.myshopify.com/products/portable-blender-bottle-usb-rechargeable-smoothie-mixer",
  "https://toptechbrandz.myshopify.com/products/wireless-4-blades-juicer",
  "https://1sqiii-qu.myshopify.com/products/usb-portable-blender-electric-juicer-machine-home-mini-food-processor-personal-cup-lemon-squeezer-handheld-smoothie-blender",
  "https://the-gadget-guide-store.myshopify.com/products/portable-juice-blender-bottle",
  "https://onestop-lifestyle.myshopify.com/products/6blade-portable-blender-mini-juicer-cup-extractor-smoothie-usb-charging",
  "https://h3fyr0-bq.myshopify.com/products/portable-blender-with-usb-rechargeable-mini-kitchen-fruit-juice-mixer",
  "https://sipp-6821.myshopify.com/products/sipp-pro-portable-blender-usb-rechargeable-6-blade-smoothie-maker",
];

const PROFESSIONAL_TASK_LINKS = [
  "https://the-perfect-pair-7785.myshopify.com/products/portable-blender",
  "https://the-perfect-pair-7785.myshopify.com/products/aura-portable-blender",
  "https://sydorastore.myshopify.com/products/electric-portable-mini-blender",
  "https://vitalifestyles.myshopify.com/products/10-blade-portable-usb-rechargeable-blender",
  "https://koolatron.myshopify.com/products/total-chef-portable-blender-neon-green",
  "https://desertdayco.myshopify.com/products/portable-electric-fruit-blender",
  "https://axefth-1c.myshopify.com/products/cordless-portable-personal-size-blender",
  "https://novanest-11731.myshopify.com/products/portable-blender",
  "https://sonet-appliances.myshopify.com/products/portable-blender",
  "https://newcomer-shop.myshopify.com/products/portable-blender-1",
  "https://kitchenaree.myshopify.com/products/portable-blender",
];

function getTaskLinks(planName: string) {
  const name = planName.toLowerCase();
  if (name.includes("basic")) return BASIC_TASK_LINKS;
  if (name.includes("standard") || name.includes("standar")) return STANDARD_TASK_LINKS;
  if (name.includes("premium")) return [...STANDARD_TASK_LINKS, ...BASIC_TASK_LINKS];
  if (name.includes("professional") || name.includes("profeshional")) return PROFESSIONAL_TASK_LINKS;
  if (name.includes("business") || name.includes("enterprise") || name.includes("elite")) {
    return [...STANDARD_TASK_LINKS, ...PROFESSIONAL_TASK_LINKS];
  }
  return BASIC_TASK_LINKS;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ title: string; message: string; isRead: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, configRes, notifRes] = await Promise.all([
        fetch("/api/user/dashboard"),
        fetch("/api/config/public"),
        fetch("/api/notifications"),
      ]);
      const dash = await dashRes.json();
      const cfg = await configRes.json();
      const notif = await notifRes.json();
      if (dash.success) setData(dash.data);
      if (cfg.success) setConfig(cfg.data.config);
      if (notif.success) setNotifications(notif.data.notifications.slice(0, 5));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useSSE(() => fetchData());

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n);

  const formatDate = (d: string) =>
    new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));

  const copyTaskLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
  };

  const activePlans = data?.activePlans?.length ? data.activePlans : data?.activePlan ? [data.activePlan] : [];
  const primaryPlan = activePlans[0];
  const onboardingSteps = [
    { title: "Choose a plan", detail: "Compare the available options.", done: activePlans.length > 0 || !!data?.pendingPlan || !!data?.pendingPayment },
    { title: "Submit payment proof", detail: "Upload your payment screenshot.", done: !!data?.pendingPayment || activePlans.length > 0 },
    { title: "Wait for approval", detail: "The team reviews your request.", done: activePlans.length > 0 },
    { title: "Track activity", detail: "Follow your plan progress.", done: activePlans.length > 0 },
    { title: "Request withdrawal", detail: "Use Withdraw when eligible.", done: false },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-500">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-home mx-auto max-w-7xl space-y-5 sm:space-y-6">
      {data?.user.accountStatus === "FROZEN" && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm">Your account has been frozen. Some actions are restricted. Please contact support.</p>
        </div>
      )}

      <section className="dashboard-welcome relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#101b58] via-[#2d1c83] to-[#7033c8] px-5 py-6 text-white shadow-xl shadow-indigo-900/20 sm:px-8 sm:py-8">
        <div className="dashboard-welcome-glow absolute -right-20 -top-24 h-72 w-72 rounded-full bg-fuchsia-400/25 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200"><Sparkles className="h-4 w-4 text-amber-300" /> SellerPro workspace</div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Good day, {data?.user.username}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100">{config.dashboard_description || "Manage your balance, plans, and earning activity from one place."}</p>
          </div>
          <Button variant="outline" size="sm" className="w-fit !border-white/40 !text-white hover:!bg-white/10" onClick={() => setHowItWorksOpen(true)}>
            <HelpCircle className="h-4 w-4" /> How it works
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3"><div className="rounded-xl bg-amber-50 p-2 text-amber-600"><Sparkles className="h-5 w-5" /></div><div><p className="font-bold text-slate-900">New here?</p><p className="mt-1 text-sm text-slate-500">Follow the five steps to get the most from your workspace.</p></div></div>
        <Button size="sm" variant="secondary" onClick={() => setOnboardingOpen(true)}>View getting started</Button>
      </section>

      <section className="grid gap-4 md:grid-cols-[1.35fr_1fr]">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="relative h-full overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#f64f8b] via-[#c336ce] to-[#7434dc] p-5 text-white shadow-lg shadow-fuchsia-700/15 sm:p-6">
            <div className="absolute -bottom-16 -right-8 h-44 w-44 rounded-full border-[22px] border-white/10" />
            <div className="relative flex items-start justify-between">
              <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-pink-100">Wallet balance</p><p className="mt-3 text-3xl font-black sm:text-4xl">{formatCurrency(data?.user.balance || 0)}</p></div>
              <div className="rounded-2xl bg-white/15 p-3"><Wallet className="h-6 w-6" /></div>
            </div>
            <div className="relative mt-6 flex items-center gap-2 text-xs text-pink-100"><ShieldCheck className="h-4 w-4" /> Live account balance</div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="h-full rounded-[1.75rem] border border-blue-100 bg-white p-5 shadow-lg shadow-slate-900/5 sm:p-6">
            <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Active plan</p><h2 className="mt-2 text-xl font-black text-slate-900">{primaryPlan?.plan.name || "No active plan"}</h2></div><div className="rounded-2xl bg-blue-50 p-3 text-blue-600"><CreditCard className="h-6 w-6" /></div></div>
            {primaryPlan ? <div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Investment</p><p className="mt-1 font-bold text-slate-900">{formatCurrency(primaryPlan.plan.investment)}</p></div><div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Timeline</p><p className="mt-1 font-bold text-slate-900">{primaryPlan.plan.durationDays} days</p></div></div> : <p className="mt-4 text-sm text-slate-500">Choose a plan to start building your activity.</p>}
            <Link href="/dashboard/plans" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700">{primaryPlan ? "View all plans" : "Browse plans"} <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
        </motion.div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href="/dashboard/plans" className="dashboard-action-tile bg-gradient-to-br from-violet-600 to-indigo-700"><ArrowDownToLine /><span>Deposit</span><small>Activate a plan</small></Link>
        <Link href="/dashboard/withdraw" className="dashboard-action-tile bg-gradient-to-br from-orange-400 to-pink-500"><ArrowUpFromLine /><span>Withdraw</span><small>Request payout</small></Link>
        <Link href="/dashboard/referrals" className="dashboard-action-tile bg-gradient-to-br from-cyan-500 to-blue-600"><Users /><span>My network</span><small>Grow together</small></Link>
        <Link href="/dashboard/support" className="dashboard-action-tile bg-gradient-to-br from-emerald-500 to-teal-600"><Headphones /><span>Help Center</span><small>Talk to support</small></Link>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total deposits", value: formatCurrency(data?.summary.totalDeposits || 0), detail: `${data?.summary.depositCount || 0} approved`, tone: "text-blue-700 bg-blue-50" },
          { label: "Total withdrawals", value: formatCurrency(data?.summary.totalWithdrawals || 0), detail: `${data?.summary.withdrawalCount || 0} completed`, tone: "text-orange-700 bg-orange-50" },
          { label: "Referral earnings", value: formatCurrency(data?.summary.referralEarnings || 0), detail: "Verified rewards", tone: "text-fuchsia-700 bg-fuchsia-50" },
          { label: "Withdrawal queue", value: String(data?.summary.pendingWithdrawals || 0), detail: "Pending or approved", tone: "text-emerald-700 bg-emerald-50" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
            <div className={`mb-3 w-fit rounded-xl px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${stat.tone}`}>{stat.label}</div>
            <p className="truncate text-lg font-black text-slate-900 sm:text-xl">{stat.value}</p>
            <p className="mt-1 text-xs text-slate-500">{stat.detail}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
        <div className="space-y-5">
          <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Your activity</p><h2 className="mt-1 text-xl font-black text-slate-900">Plan progress</h2></div><Link href="/dashboard/plans" className="text-sm font-bold text-blue-600">Explore plans</Link></div>
          {activePlans.length > 0 ? activePlans.map((plan, index) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + index * 0.05 }} className="relative overflow-hidden rounded-[1.75rem] border border-blue-100 bg-white p-5 shadow-lg shadow-slate-900/5 sm:p-6">
              <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-[3rem] bg-blue-50" />
              <div className="relative flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Active deposit</p><h3 className="mt-1 text-xl font-black text-slate-900">{plan.plan.name}</h3></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{plan.status}</span></div>
              <div className="relative mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><div><p className="text-xs text-slate-500">Investment</p><p className="mt-1 font-bold text-slate-900">{formatCurrency(plan.plan.investment)}</p></div><div><p className="text-xs text-slate-500">Expected return</p><p className="mt-1 font-bold text-emerald-600">{formatCurrency(plan.plan.statedReturn)}</p></div><div><p className="text-xs text-slate-500">Started</p><p className="mt-1 text-sm font-semibold text-slate-700">{formatDate(plan.startDate)}</p></div><div><p className="text-xs text-slate-500">Ends</p><p className="mt-1 text-sm font-semibold text-slate-700">{formatDate(plan.endDate)}</p></div></div>
              <div className="relative mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-fuchsia-500" style={{ width: `${Math.min(100, Math.max(8, plan.startDate && plan.endDate ? ((Date.now() - new Date(plan.startDate).getTime()) / (new Date(plan.endDate).getTime() - new Date(plan.startDate).getTime())) * 100 : 8))}%` }} /></div>
            </motion.div>
          )) : <div className="rounded-[1.75rem] border border-dashed border-blue-200 bg-white p-8 text-center"><CreditCard className="mx-auto h-10 w-10 text-blue-300" /><p className="mt-3 font-bold text-slate-900">No active plan yet</p><p className="mt-1 text-sm text-slate-500">Your activated plan will appear here.</p></div>}
        </div>

        <div className="rounded-[1.75rem] bg-gradient-to-br from-[#152568] to-[#293a9c] p-5 text-white shadow-lg shadow-indigo-900/15 sm:p-6"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-200">Next step</p><h2 className="mt-2 text-xl font-black">{data?.pendingPlan?.plan.name || data?.pendingPayment?.plan.name || (primaryPlan ? "Track your activity" : "Choose a plan")}</h2></div><Clock className="h-6 w-6 text-amber-300" /></div>{data?.pendingPlan || data?.pendingPayment ? <><p className="mt-4 text-sm leading-6 text-indigo-100">Your payment is waiting for administrator verification.</p><p className="mt-4 text-xs text-indigo-200">Submitted {formatDate(data.pendingPlan?.createdAt || data.pendingPayment?.createdAt || "")}</p></> : <p className="mt-4 text-sm leading-6 text-indigo-100">{primaryPlan ? "Use your plan details and task links to track progress." : "Start by choosing a plan that fits your goals."}</p>}<Link href={data?.pendingPlan || data?.pendingPayment ? "/dashboard/support" : primaryPlan ? "/dashboard/referrals" : "/dashboard/plans"} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/20">Continue <ArrowRight className="h-4 w-4" /></Link></div>
      </div>

      {activePlans.map((plan) => (
        <Card key={plan.id} title={`TASK: ${plan.plan.name}`} subtitle={`Complete these tasks for your ${plan.plan.name} plan`}>
          <div className="space-y-4">
            <div className="text-sm text-slate-700">
              <p className="font-medium mb-2">Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Copy a link below.</li>
                <li>Paste it in the comment section of any TikTok star video, famous YouTuber video, famous Facebook account, or famous Instagram user.</li>
              </ol>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {getTaskLinks(plan.plan.name).map((link) => (
                <div key={`${plan.id}-${link}`} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <a href={link} target="_blank" rel="noreferrer" className="min-w-0 flex-1 break-all text-sm text-blue-600 hover:underline">
                    {link}
                  </a>
                  <button type="button" onClick={() => copyTaskLink(link)} title="Copy link" className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-white hover:text-blue-600">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}

      {notifications.length > 0 && (
        <Card title="Recent Notifications" subtitle="Latest updates on your account">
          <div className="space-y-3">
            {notifications.map((n, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${n.isRead ? "bg-slate-50" : "bg-blue-50"}`}>
                <Bell className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm text-slate-900">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"><ShieldCheck className="h-5 w-5 text-emerald-600" /><h3 className="mt-3 font-bold text-slate-900">Transparent status</h3><p className="mt-1 text-sm leading-6 text-slate-500">Payment, plan, referral, and withdrawal states are shown from your account records.</p></div>
        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"><Clock className="h-5 w-5 text-blue-600" /><h3 className="mt-3 font-bold text-slate-900">Withdrawal timing</h3><p className="mt-1 text-sm leading-6 text-slate-500">Approved withdrawal requests are usually processed within 2–4 hours.</p></div>
        <Link href="/dashboard/support" className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300"><Headphones className="h-5 w-5 text-fuchsia-600" /><h3 className="mt-3 font-bold text-slate-900">Need assistance?</h3><p className="mt-1 text-sm leading-6 text-slate-500">Contact the Help Center for account or payment questions.</p></Link>
      </section>

      <Modal isOpen={howItWorksOpen} onClose={() => setHowItWorksOpen(false)} title="How It Works" size="lg">
        <div className="space-y-4">
          <p className="text-slate-700 whitespace-pre-line">
            {config.how_it_works_text}
          </p>
          {config.how_it_works_audio && (
            <audio controls className="w-full">
              <source src={config.how_it_works_audio} />
            </audio>
          )}
          {config.how_it_works_video && (
            <video controls className="w-full rounded-xl">
              <source src={config.how_it_works_video} />
            </video>
          )}
        </div>
      </Modal>

      <Modal isOpen={onboardingOpen} onClose={() => setOnboardingOpen(false)} title="Getting started" size="lg">
        <div className="space-y-3">
          <p className="text-sm leading-6 text-slate-500">A simple overview of the existing SellerPro flow.</p>
          {onboardingSteps.map((step, index) => (
            <div key={step.title} className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-slate-50/70 p-4">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${step.done ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>{step.done ? "✓" : index + 1}</div>
              <div><p className="font-bold text-slate-900">{step.title}</p><p className="mt-1 text-sm text-slate-500">{step.detail}</p></div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
