import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { forgotPasswordSchema, normalizeMobile } from "@/lib/validators";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`forgot:${ip}`, 3, 60 * 60 * 1000);
    if (!rl.allowed) return apiError("Too many requests", 429);

    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400);
    }

    const normalizedMobile = normalizeMobile(parsed.data.mobile);
    const user = await prisma.user.findFirst({
      where: { email: parsed.data.email, mobile: normalizedMobile },
    });

    if (!user) {
      return apiSuccess({
        message:
          "If the account exists, a reset request has been submitted for admin review.",
      });
    }

    const existing = await prisma.passwordResetRequest.findFirst({
      where: { userId: user.id, status: "PENDING" },
    });
    if (existing) {
      return apiSuccess({
        message: "A password reset request is already pending admin review.",
      });
    }

    await prisma.passwordResetRequest.create({
      data: { userId: user.id },
    });

    return apiSuccess({
      message:
        "Password reset request submitted. Please wait for administrator approval.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
