"use client";

import Button from "@/components/ui/Button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-black text-slate-900">Dashboard unavailable</h1><p className="mt-2 text-sm text-slate-500">Please retry loading your workspace.</p><Button className="mt-5" onClick={() => reset()}>Retry</Button></div>;
}
