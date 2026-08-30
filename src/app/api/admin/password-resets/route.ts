import { NextRequest } from "next/server";
import { requireAuth, generateVerificationCode } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { getClientIp } from "@/lib/rate-limit";

export async function GET() {
  try {
    await requireAuth("ADMIN");

    const requests = await prisma.passwordResetRequest.findMany({
      include: {
        user: { select: { id: true, username: true, email: true, mobile: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(requests);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAuth("ADMIN");
    const body = await request.json();
    const { requestId, action, rejectionReason } = body;

    if (!requestId || !action) {
      return apiError("Request ID and action required", 400);
    }

    const resetRequest = await prisma.passwordResetRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!resetRequest) return apiError("Request not found", 404);
    if (resetRequest.status !== "PENDING") {
      return apiError("Request already processed", 400);
    }

    const ip = getClientIp(request);
    const expiryMinutes =
      parseInt(process.env.PASSWORD_RESET_CODE_EXPIRY_MINUTES || "30");

    if (action === "approve") {
      const code = generateVerificationCode();
      const codeExpiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

      await prisma.passwordResetRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          verificationCode: code,
          codeExpiresAt,
          reviewedBy: admin.id,
          reviewedAt: new Date(),
        },
      });

      await createNotification(
        resetRequest.userId,
        "Password Reset Approved",
        `Your password reset has been approved. Check your email for verification code: ${code}. Code expires in ${expiryMinutes} minutes.`
      );

      await createAuditLog({
        adminId: admin.id,
        action: "PASSWORD_RESET_APPROVED",
        targetUserId: resetRequest.userId,
        ipAddress: ip,
      });

      return apiSuccess({
        message: "Password reset approved. Verification code sent to user notification.",
        code,
      });
    } else if (action === "reject") {
      await prisma.passwordResetRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          rejectionReason,
          reviewedBy: admin.id,
          reviewedAt: new Date(),
        },
      });

      await createNotification(
        resetRequest.userId,
        "Password Reset Rejected",
        rejectionReason || "Your password reset request was rejected."
      );

      await createAuditLog({
        adminId: admin.id,
        action: "PASSWORD_RESET_REJECTED",
        targetUserId: resetRequest.userId,
        newValue: rejectionReason,
        ipAddress: ip,
      });

      return apiSuccess({ message: "Password reset rejected" });
    }

    return apiError("Invalid action", 400);
  } catch (error) {
    return handleApiError(error);
  }
}
