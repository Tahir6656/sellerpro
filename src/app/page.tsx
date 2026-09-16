"use client";

import Link from "next/link";
import { ArrowRight, Check, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";

interface Plan {
  id: string;
  name: string;
  products: number;
  durationDays: number;
  investment: number;
  statedReturn: number;
}

const fallbackPlans: Plan[] = [
  { id: "basic", name: "Basic", products: 10, durationDays: 3, investment: 300, statedReturn: 500 },
  { id: "standard", name: "Standard", products: 15, durationDays: 4, investment: 400, statedReturn: 700 },
  { id: "premium", name: "Premium", products: 25, durationDays: 5, investment: 500, statedReturn: 900 },
];

const currency = (value: number) => new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(value);

export default function HomePage() {
  const [plans, setPlans] = useState<Plan[]>(fallbackPlans);

  useEffect(() => {
    fetch("/api/config/public").then((response) => response.json()).then((json) => {
      if (json.success && json.data.plans?.length) setPlans(json.data.plans.slice(0, 3));
    }).catch(() => {});
  }, []);

  return (
    <main className="landing-bg landing-grid min-h-screen overflow-hidden">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3 text-xl font-black tracking-tight text-[var(--brand-ink)]">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand-gold)] text-lg">S</span>
          SellerPro
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden px-3 py-2 text-sm font-bold text-slate-700 sm:inline">Sign in</Link>
          <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-ink)] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5">Get started <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-10 sm:px-8 sm:pb-24 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-teal)]"><Sparkles className="h-4 w-4" /> A clearer way to grow</p>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-tight text-[var(--brand-ink)] sm:text-7xl">Build momentum with a plan that works.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">Choose a structured selling plan, submit secure payment proof, and manage your activity from one calm, transparent workspace.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-teal)] px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-teal-900/15 transition hover:-translate-y-0.5">Create your account <ArrowRight className="h-4 w-4" /></Link><Link href="/login" className="rounded-xl border border-slate-300 bg-white/70 px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:border-slate-400">Already a member</Link></div>
          <div className="mt-9 flex flex-wrap gap-5 text-sm font-semibold text-slate-600"><span className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[var(--brand-teal)]" /> Secure account access</span><span className="flex items-center gap-2"><WalletCards className="h-5 w-5 text-[var(--brand-coral)]" /> Clear payout tracking</span></div>
        </div>
        <div className="relative rounded-[2rem] bg-[var(--brand-ink)] p-5 text-white shadow-2xl shadow-slate-900/20 sm:p-7"><div className="absolute right-0 top-0 h-40 w-40 rounded-bl-[5rem] bg-[var(--brand-coral)]/70" /><div className="relative"><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Your operating view</p><div className="mt-7 rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur"><div className="flex items-end justify-between"><div><p className="text-sm text-slate-300">Available balance</p><p className="mt-2 text-4xl font-black">PKR 12,450</p></div><span className="rounded-xl bg-emerald-400/15 px-3 py-2 text-xs font-bold text-emerald-300">+18.4%</span></div><div className="mt-7 h-2 rounded-full bg-white/10"><div className="h-full w-3/4 rounded-full bg-[var(--brand-gold)]" /></div><div className="mt-4 flex justify-between text-xs text-slate-400"><span>Plan progress</span><span>75%</span></div></div><div className="mt-4 grid grid-cols-2 gap-4"><div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-slate-400">Active plan</p><p className="mt-2 font-bold">Premium</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-slate-400">Next payout</p><p className="mt-2 font-bold text-[var(--brand-gold)]">PKR 900</p></div></div></div></div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8"><div className="mb-8 flex items-end justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-coral)]">Plans with purpose</p><h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--brand-ink)] sm:text-4xl">Start at your pace</h2></div><Link href="/register" className="hidden items-center gap-2 text-sm font-bold text-[var(--brand-teal)] sm:flex">Compare in workspace <ArrowRight className="h-4 w-4" /></Link></div><div className="grid gap-4 md:grid-cols-3">{plans.map((plan, index) => <article key={plan.id} className={`rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${index === 1 ? "border-[var(--brand-teal)] ring-2 ring-emerald-100" : "border-slate-200"}`}><div className="flex items-start justify-between"><h3 className="text-xl font-black text-[var(--brand-ink)]">{plan.name}</h3>{index === 1 && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-[var(--brand-teal)]">Popular</span>}</div><p className="mt-5 text-3xl font-black text-[var(--brand-teal)]">{currency(plan.investment)}</p><p className="mt-1 text-sm text-slate-500">{plan.durationDays} day activity window</p><div className="my-5 h-px bg-slate-100" /><ul className="space-y-3 text-sm text-slate-600"><li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-[var(--brand-coral)]" /> {plan.products} product tasks</li><li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-[var(--brand-coral)]" /> Expected return {currency(plan.statedReturn)}</li><li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-[var(--brand-coral)]" /> Approval tracking</li></ul><Link href="/register" className="mt-6 block rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-bold text-[var(--brand-ink)] transition hover:bg-emerald-50 hover:text-[var(--brand-teal)]">Choose this plan</Link></article>)}</div></section>
    </main>
  );
}
