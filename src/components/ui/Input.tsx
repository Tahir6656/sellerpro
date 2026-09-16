"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  dark?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, id, dark, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordInput = type === "password";
    const inputType = isPasswordInput && showPassword ? "text" : type;

    const inputClasses = dark
      ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-blue-500"
      : "bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-blue-500";

    const labelClasses = dark ? "text-white" : "text-slate-700";

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className={`block text-sm font-medium mb-1.5 ${labelClasses}`}>
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={inputType}
            className={`w-full px-4 py-2.5 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent ${
              error ? "border-red-400" : ""
            } ${inputClasses} ${isPasswordInput ? "pr-11" : ""} ${className}`}
            {...props}
          />
          {isPasswordInput && (
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition-colors hover:text-blue-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
