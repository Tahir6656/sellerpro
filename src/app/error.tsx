"use client";

import { useEffect } from "react";
import Button from "@/components/ui/Button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {}, []);
  return <main className="flex min-h-screen items-center justify-center p-5"><div className="max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-xl"><h1 className="text-2xl font-black text-slate-900">Something went wrong</h1><p className="mt-2 text-sm text-slate-500">We could not load this page. Please try again.</p><Button className="mt-6" onClick={() => reset()}>Try again</Button></div></main>;
}
