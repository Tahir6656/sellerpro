import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export default function Card({ children, className = "", title, subtitle }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-[var(--line)] shadow-[0_8px_30px_rgba(23,33,29,0.05)] ${className}`}>
      {(title || subtitle) && (
        <div className="px-6 pt-6 pb-4 border-b border-[var(--line)]/70">
          {title && <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
      )}
      <div className={title || subtitle ? "p-6" : "p-6"}>{children}</div>
    </div>
  );
}
