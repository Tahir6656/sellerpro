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
    plan: { name: string; investment: number; durationDays: number; statedReturn: number };
    startDate: string;
    endDate: string;
    status: string;
  } | null;
  pendingPlan: { plan: { name: string }; createdAt: string; status: string } | null;
  pendingPayment: { plan: { name: string }; createdAt: string } | null;
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

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-500">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {data?.user.accountStatus === "FROZEN" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-800">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm">Your account has been frozen. Some actions are restricted. Please contact support.</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {data?.user.username}
          </h1>
          <p className="text-slate-500 mt-1">
            {config.dashboard_description || "Manage your SellerPro account"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setHowItWorksOpen(true)}>
          <HelpCircle className="w-4 h-4" /> How It Works
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0">
            <div className="flex items-center gap-3 mb-3">
              <Wallet className="w-6 h-6" />
              <span className="text-blue-100 text-sm">Available Balance</span>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(data?.user.balance || 0)}</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card title="Active Plan">
            {data?.activePlan ? (
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-lg text-blue-600">{data.activePlan.plan.name}</p>
                <p>Investment: {formatCurrency(data.activePlan.plan.investment)}</p>
                <p>Duration: {data.activePlan.plan.durationDays} days</p>
                <p>Start: {formatDate(data.activePlan.startDate)}</p>
                <p>End: {formatDate(data.activePlan.endDate)}</p>
                <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                  {data.activePlan.status}
                </span>
              </div>
            ) : (
              <div className="text-center py-4">
                <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No active plan</p>
                <Link href="/dashboard/plans">
                  <Button size="sm" className="mt-3">Browse Plans</Button>
                </Link>
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card title="Pending Activation">
            {data?.pendingPlan || data?.pendingPayment ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-amber-600">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">Awaiting Verification</span>
                </div>
                <p>Plan: {data.pendingPlan?.plan.name || data.pendingPayment?.plan.name}</p>
                <p>Submitted: {formatDate(data.pendingPlan?.createdAt || data.pendingPayment?.createdAt || "")}</p>
              </div>
            ) : (
              <p className="text-slate-500 text-sm text-center py-4">No pending activations</p>
            )}
          </Card>
        </motion.div>
      </div>

      {data?.activePlan && (
        <Card title="TASK" subtitle={`Complete these tasks for your ${data.activePlan.plan.name} plan`}>
          <div className="space-y-4">
            <div className="text-sm text-slate-700">
              <p className="font-medium mb-2">Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Copy a link below.</li>
                <li>Paste it in the comment section of any TikTok star video, famous YouTuber video, famous Facebook account, or famous Instagram user.</li>
              </ol>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {getTaskLinks(data.activePlan.plan.name).map((link) => (
                <div key={link} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
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
      )}

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
    </div>
  );
}
