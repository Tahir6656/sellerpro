"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AuthShell, { redirectAfterAuth } from "@/components/auth/AuthShell";
import { useToast } from "@/components/ui/Toast";

function RegisterForm() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [referrerName, setReferrerName] = useState("");
  const [form, setForm] = useState({
    username: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    referralCode: searchParams.get("ref") || "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref) return;

    setForm((f) => ({ ...f, referralCode: ref }));

    fetch(`/api/auth/referrer?code=${encodeURIComponent(ref)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setReferrerName(json.data.username);
      })
      .catch(() => {});
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        toast("Account created!", "success");
        redirectAfterAuth(json.data.user.role);
      } else {
        toast(json.error || "Registration failed", "error");
        setLoading(false);
      }
    } catch {
      toast("Something went wrong", "error");
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create Account" subtitle="Register to start using SellerPro">
      {form.referralCode && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-sm text-blue-900">
          {referrerName ? (
            <>
              You were referred by: <strong>{referrerName}</strong>
            </>
          ) : (
            <>
              Referral code: <strong>{form.referralCode}</strong>
            </>
          )}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Username" name="username" value={form.username} onChange={handleChange} required />
        <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
        <Input label="Mobile Number" name="mobile" type="tel" placeholder="03001234567" value={form.mobile} onChange={handleChange} required />
        <Input label="Password" name="password" type="password" value={form.password} onChange={handleChange} required />
        <Input label="Confirm Password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required />
        <Button type="submit" className="w-full" loading={loading}>
          Create Account
        </Button>
      </form>
      <p className="text-center text-sm text-slate-600 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-600 font-semibold hover:underline">Sign In</Link>
      </p>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen auth-bg flex items-center justify-center text-white">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
