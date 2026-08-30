import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`verify-code:${ip}`, 10, 15 * 60 * 1000);
    if (!rl.allowed) return apiError("Too many attempts", 429);

    const { email, code } = await request.json();
    if (!email || !code) return apiError("Email and code required", 400);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return apiError("Invalid code", 400);

    const resetRequest = await prisma.passwordResetRequest.findFirst({
      where: {
        userId: user.id,
        status: "APPROVED",
        verificationCode: code,
        codeUsed: false,
        codeExpiresAt: { gt: new Date() },
      },
    });

    if (!resetRequest) return apiError("Invalid or expired code", 400);

    return apiSuccess({ valid: true });
  } catch (error) {
    return handleApiError(error);
  }
}
