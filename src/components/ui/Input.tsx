"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  dark?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, id, dark, ...props }, ref) => {
    const inputClasses = dark
      ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-blue-500"
      : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-blue-500";

    const labelClasses = dark ? "text-white" : "text-slate-700";

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className={`block text-sm font-medium mb-1.5 ${labelClasses}`}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`w-full px-4 py-2.5 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:border-transparent ${
            error ? "border-red-400" : ""
          } ${inputClasses} ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
