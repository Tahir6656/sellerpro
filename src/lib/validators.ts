import { z } from "zod";

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be at most 30 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    email: z.string().email("Invalid email address"),
    mobile: z
      .string()
      .regex(/^(\+92|0)?3[0-9]{9}$/, "Invalid Pakistani mobile number format"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[0-9]/, "Password must contain a number"),
    confirmPassword: z.string(),
    referralCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  mobile: z
    .string()
    .regex(/^(\+92|0)?3[0-9]{9}$/, "Invalid mobile number format"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  mobile: z
    .string()
    .regex(/^(\+92|0)?3[0-9]{9}$/, "Invalid mobile number format"),
});

export const resetPasswordSchema = z
  .object({
    code: z.string().length(6, "Verification code must be 6 digits"),
    email: z.string().email(),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[0-9]/, "Password must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(8)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/[0-9]/),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const withdrawalSchema = z.object({
  methodId: z.string().min(1),
  accountNumber: z.string().min(5),
  accountHolder: z.string().min(2),
  amount: z.number().positive("Amount must be positive"),
});

export const planSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  products: z.number().int().positive(),
  durationDays: z.number().int().positive(),
  investment: z.number().positive(),
  statedReturn: z.number().positive(),
  isActive: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const paymentAccountSchema = z.object({
  methodName: z.string().min(1),
  accountHolder: z.string().min(1),
  accountNumber: z.string().min(1),
  mobileId: z.string().optional(),
  instructions: z.string().optional(),
  isActive: z.boolean().optional(),
});

export function normalizeMobile(mobile: string): string {
  let normalized = mobile.replace(/\s/g, "");
  if (normalized.startsWith("+92")) {
    normalized = "0" + normalized.slice(3);
  }
  if (!normalized.startsWith("0")) {
    normalized = "0" + normalized;
  }
  return normalized;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}
