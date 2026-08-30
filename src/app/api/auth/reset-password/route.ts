import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validators";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`reset:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.allowed) return apiError("Too many attempts", 429);

    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400);
    }

    const { code, email, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return apiError("Invalid request", 400);

    const resetRequest = await prisma.passwordResetRequest.findFirst({
      where: {
        userId: user.id,
        status: "APPROVED",
        verificationCode: code,
        codeUsed: false,
        codeExpiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!resetRequest) {
      return apiError("Invalid or expired verification code", 400);
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordResetRequest.update({
        where: { id: resetRequest.id },
        data: { codeUsed: true },
      }),
    ]);

    return apiSuccess({ message: "Password updated successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
