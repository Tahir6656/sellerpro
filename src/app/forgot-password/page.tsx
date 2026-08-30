"use client";

import { useState } from "react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AuthShell from "@/components/auth/AuthShell";
import { useToast } from "@/components/ui/Toast";

type Step = "request" | "verify" | "reset";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mobile }),
      });
      const json = await res.json();
      toast(json.data?.message || json.error || "Request submitted", json.success ? "success" : "error");
      if (json.success) setStep("verify");
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const json = await res.json();
      if (json.success) {
        toast("Code verified!", "success");
        setStep("reset");
      } else {
        toast(json.error || "Invalid code", "error");
      }
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword, confirmPassword }),
      });
      const json = await res.json();
      if (json.success) {
        toast("Password updated! You can now login.", "success");
        window.location.href = "/login";
      } else {
        toast(json.error || "Reset failed", "error");
      }
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Reset Password" subtitle="Submit a request for admin approval">
      {step === "request" && (
        <form onSubmit={handleRequest} className="space-y-5">
          <p className="text-sm text-slate-600">
            An administrator must approve your request before you can reset your password.
          </p>
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Mobile Number" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
          <Button type="submit" className="w-full" loading={loading}>Submit Request</Button>
        </form>
      )}
      {step === "verify" && (
        <form onSubmit={handleVerify} className="space-y-5">
          <p className="text-sm text-slate-600">
            Enter the verification code from your notifications after admin approval.
          </p>
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Verification Code" value={code} onChange={(e) => setCode(e.target.value)} required maxLength={6} />
          <Button type="submit" className="w-full" loading={loading}>Verify Code</Button>
        </form>
      )}
      {step === "reset" && (
        <form onSubmit={handleReset} className="space-y-5">
          <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          <Button type="submit" className="w-full" loading={loading}>Reset Password</Button>
        </form>
      )}
      <p className="text-center text-sm text-slate-600 mt-6">
        <Link href="/login" className="text-blue-600 font-semibold hover:underline">Back to Login</Link>
      </p>
    </AuthShell>
  );
}
