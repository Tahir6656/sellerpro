import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export default function Card({ children, className = "", title, subtitle }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-blue-100/80 shadow-sm shadow-slate-900/5 ${className}`}>
      {(title || subtitle) && (
        <div className="px-6 pt-6 pb-4 border-b border-blue-50">
          {title && <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
      )}
      <div className={title || subtitle ? "p-6" : "p-6"}>{children}</div>
    </div>
  );
}
