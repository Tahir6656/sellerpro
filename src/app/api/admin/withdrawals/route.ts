import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { createTransaction } from "@/lib/transactions";
import { getClientIp } from "@/lib/rate-limit";

export async function GET() {
  try {
    await requireAuth("ADMIN");

    const requests = await prisma.withdrawalRequest.findMany({
      include: {
        user: { select: { id: true, username: true, mobile: true } },
        method: true,
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
    const { requestId, action, adminNote, txReference, rejectionReason } = body;

    if (!requestId || !action) {
      return apiError("Request ID and action required", 400);
    }

    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id: requestId },
      include: { user: true, method: true },
    });

    if (!withdrawal) return apiError("Request not found", 404);

    if (withdrawal.status !== "PENDING" && action !== "complete") {
      return apiError("Request already processed", 400);
    }
    if (action === "complete" && withdrawal.status !== "APPROVED") {
      return apiError("Withdrawal must be approved before completing", 400);
    }

    const ip = getClientIp(request);
    const now = new Date();

    if (action === "approve") {
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: withdrawal.userId },
      });
      if (user.balance < withdrawal.amount) {
        return apiError("User has insufficient balance", 400);
      }

      await createTransaction({
        userId: withdrawal.userId,
        type: "WITHDRAWAL",
        amount: withdrawal.amount,
        description: `Withdrawal via ${withdrawal.method.name}`,
        relatedId: withdrawal.id,
        source: admin.id,
      });

      await prisma.withdrawalRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          reviewedBy: admin.id,
          reviewedAt: now,
          adminNote,
          txReference,
        },
      });

      await createNotification(
        withdrawal.userId,
        "Withdrawal Approved",
        `Your withdrawal of ${withdrawal.amount} has been approved.`
      );

      await createAuditLog({
        adminId: admin.id,
        action: "WITHDRAWAL_APPROVED",
        targetUserId: withdrawal.userId,
        newValue: String(withdrawal.amount),
        ipAddress: ip,
      });
    } else if (action === "complete") {
      await prisma.withdrawalRequest.update({
        where: { id: requestId },
        data: {
          status: "COMPLETED",
          completedAt: now,
          txReference,
          adminNote,
        },
      });

      await createNotification(
        withdrawal.userId,
        "Withdrawal Completed",
        `Your withdrawal of ${withdrawal.amount} has been completed.`
      );

      await createAuditLog({
        adminId: admin.id,
        action: "WITHDRAWAL_COMPLETED",
        targetUserId: withdrawal.userId,
        newValue: txReference,
        ipAddress: ip,
      });
    } else if (action === "reject") {
      await prisma.withdrawalRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          reviewedBy: admin.id,
          reviewedAt: now,
          adminNote: rejectionReason || adminNote,
        },
      });

      await createNotification(
        withdrawal.userId,
        "Withdrawal Rejected",
        rejectionReason || "Your withdrawal request was rejected."
      );

      await createAuditLog({
        adminId: admin.id,
        action: "WITHDRAWAL_REJECTED",
        targetUserId: withdrawal.userId,
        newValue: rejectionReason,
        ipAddress: ip,
      });
    } else {
      return apiError("Invalid action", 400);
    }

    return apiSuccess({ message: `Withdrawal ${action} successful` });
  } catch (error) {
    return handleApiError(error);
  }
}
