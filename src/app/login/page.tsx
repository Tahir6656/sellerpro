"use client";

import { useState } from "react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AuthShell, { redirectAfterAuth } from "@/components/auth/AuthShell";
import { useToast } from "@/components/ui/Toast";

export default function LoginPage() {
  const { toast } = useToast();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mobile, password }),
      });
      const json = await res.json();
      if (json.success) {
        toast("Login successful!", "success");
        redirectAfterAuth(json.data.user.role);
      } else {
        toast(json.error || "Login failed", "error");
        setLoading(false);
      }
    } catch {
      toast("Something went wrong", "error");
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Sign In" subtitle="Enter your mobile number and password">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Mobile Number"
          type="tel"
          placeholder="03001234567"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="text-right">
          <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline font-medium">
            Forgot Password?
          </Link>
        </div>
        <Button type="submit" className="w-full" loading={loading}>
          Sign In
        </Button>
      </form>
      <p className="text-center text-sm text-slate-600 mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-blue-600 font-semibold hover:underline">
          Create Account
        </Link>
      </p>
    </AuthShell>
  );
}
