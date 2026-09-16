import Link from "next/link";
import { ArrowLeft, CheckCircle, Clock3, ShieldCheck } from "lucide-react";

const pageContent = {
  about: {
    eyebrow: "About SellerPro",
    title: "A clear workspace for managed account activity",
    intro: "SellerPro brings plans, payment review, wallet activity, referrals, withdrawals, and support into one account workspace.",
    sections: [
      ["Account visibility", "Track your balance, active plans, payment requests, withdrawal status, referral activity, and transaction history from your authenticated dashboard."],
      ["Human review", "Payment and withdrawal requests follow the existing administrator review process. Statuses are shown as they are recorded in your account."],
      ["Help when needed", "Use the Help Center to send a message, attach an image, and continue the conversation with the support team."],
    ],
  },
  terms: {
    eyebrow: "Terms of use",
    title: "Use the platform with clear expectations",
    intro: "These plain-language notes summarize the existing product flow. They do not replace any formal agreement provided by the business.",
    sections: [
      ["Account responsibility", "Keep your login details private and submit accurate account and payment information. Contact support if you see activity you do not recognize."],
      ["Plan activation", "A plan becomes active only after the submitted payment request is reviewed and approved by an administrator."],
      ["Status and review", "Requests may remain pending while they are reviewed. Rejected requests show the recorded reason when one is available."],
    ],
  },
  privacy: {
    eyebrow: "Privacy",
    title: "Your account information stays in your workspace",
    intro: "SellerPro uses account information to authenticate users, process requests, record transactions, and provide support.",
    sections: [
      ["Information used", "Account details, plan activity, payment requests, withdrawals, notifications, referrals, and support messages are used to operate the platform."],
      ["Uploaded images", "Payment proofs and support attachments are stored privately and served only through authenticated access."],
      ["Account safety", "Use a unique password, review your activity, and contact the Help Center if you notice anything unusual."],
    ],
  },
  withdrawals: {
    eyebrow: "Withdrawal policy",
    title: "Understand the withdrawal review flow",
    intro: "Withdrawal requests are checked against the account balance, selected method, and configured limits before administrator processing.",
    sections: [
      ["Submit", "Choose an active method, enter the account details, and submit an amount within the displayed limits."],
      ["Review", "Requests move through pending and approved states before completion. A rejection includes the administrator note when available."],
      ["Timing", "Processing time is up to 2–4 hours after review. Contact the Help Center if the request is not received within that window."],
    ],
  },
  referrals: {
    eyebrow: "Referral eligibility",
    title: "See how referral rewards become eligible",
    intro: "The referral tree reflects the stored referrer relationship and the current plan and verification status for each account.",
    sections: [
      ["Direct and indirect", "Your referral view can show direct referrals and deeper levels available in the account relationship tree."],
      ["Eligibility", "A referral becomes eligible when the referred user has an approved active plan and the referral verification is complete."],
      ["Recorded income", "Paid rewards appear in referral earnings and the transaction activity ledger when the existing reward process records them."],
    ],
  },
  payments: {
    eyebrow: "Payment instructions",
    title: "Submit payment proof with confidence",
    intro: "Choose a visible active plan, send the displayed amount using an available payment account, and upload the payment screenshot.",
    sections: [
      ["Before sending", "Confirm the plan name, investment amount, payment method, account holder, and account number shown in the activation dialog."],
      ["Upload proof", "Attach a clear image of the completed payment. The file is stored privately for authenticated review."],
      ["After submission", "Your request appears as pending until an administrator approves or rejects it. The account notification center shows updates."],
    ],
  },
} as const;

type TrustPageKey = keyof typeof pageContent;

export default function TrustPage({ page }: { page: TrustPageKey }) {
  const content = pageContent[page];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.1),transparent_28rem),#edf3f9] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"><ArrowLeft className="h-4 w-4" /> Back to SellerPro</Link>
        <section className="mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#101b58] via-[#2d1c83] to-[#7033c8] p-6 text-white shadow-xl shadow-indigo-900/15 sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">{content.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{content.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100">{content.intro}</p>
        </section>
        <div className="mt-5 space-y-3">
          {content.sections.map(([title, body]) => <section key={title} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><div className="rounded-xl bg-blue-50 p-2 text-blue-600"><CheckCircle className="h-4 w-4" /></div><div><h2 className="font-bold text-slate-900">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{body}</p></div></div></section>)}
        </div>
        <div className="mt-5 flex flex-wrap gap-3 rounded-2xl border border-blue-100 bg-white p-4 text-xs text-slate-500"><span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Authenticated account access</span><span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-blue-600" /> Statuses reflect recorded activity</span></div>
      </div>
    </main>
  );
}
