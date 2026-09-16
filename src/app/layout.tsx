import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const bodyFont = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SellerPro — Professional Selling Platform",
  description:
    "SellerPro is a professional platform for managed selling plans, secure payments, and referral management.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-slate-50 text-slate-900"
        suppressHydrationWarning
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
