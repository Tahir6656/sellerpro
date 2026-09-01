import { NextRequest } from "next/server";
import { requireAuth, generateVerificationCode } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { createTransaction } from "@/lib/transactions";
import { getClientIp } from "@/lib/rate-limit";
import { addDays } from "date-fns";
import { getConfig } from "@/lib/config";
import { broadcastConfigUpdate } from "@/lib/events";

export async function GET() {
  try {
    await requireAuth("ADMIN");

    const requests = await prisma.paymentRequest.findMany({
      include: {
        user: { select: { id: true, username: true, mobile: true } },
        plan: true,
        paymentAccount: true,
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

    const paymentRequest = await prisma.paymentRequest.findUnique({
      where: { id: requestId },
      include: { user: true, plan: true },
    });

    if (!paymentRequest) return apiError("Request not found", 404);
    if (paymentRequest.status !== "PENDING") {
      return apiError("Request already processed", 400);
    }

    const ip = getClientIp(request);

    if (action === "approve") {
      const now = new Date();
      const endDate = addDays(now, paymentRequest.plan.durationDays);

      const userPlan = await prisma.userPlan.findFirst({
        where: {
          userId: paymentRequest.userId,
          planId: paymentRequest.planId,
          status: "PENDING",
        },
        orderBy: { createdAt: "desc" },
      });

      await prisma.$transaction(async (tx) => {
        if (userPlan) {
          const updated = await tx.userPlan.update({
            where: { id: userPlan.id },
            data: {
              status: "APPROVED",
              startDate: now,
              endDate,
              activatedAt: now,
            },
          });

          const userRecord = await tx.user.findUnique({
            where: { id: paymentRequest.userId },
            select: { activePlanId: true },
          });

          if (!userRecord?.activePlanId) {
            await tx.user.update({
              where: { id: paymentRequest.userId },
              data: { activePlanId: updated.id },
            });
          }
        }

        await tx.paymentRequest.update({
          where: { id: requestId },
          data: {
            status: "APPROVED",
            reviewedBy: admin.id,
            reviewedAt: now,
          },
        });
      });

      await createTransaction({
        userId: paymentRequest.userId,
        type: "PLAN_ACTIVATION",
        amount: paymentRequest.plan.statedReturn,
        description: `Plan activated: ${paymentRequest.plan.name}`,
        relatedId: paymentRequest.id,
        source: admin.id,
      });

      if (paymentRequest.user.referrerId) {
        const verification = await prisma.referralVerification.findUnique({
          where: { referredId: paymentRequest.userId },
        });
        if (verification && !verification.rewardPaid) {
          const rewardAmount =
            parseFloat(await getConfig("referral_reward_amount")) || 50;
          await createTransaction({
            userId: paymentRequest.user.referrerId,
            type: "REFERRAL_REWARD",
            amount: rewardAmount,
            description: `Referral reward for ${paymentRequest.user.username}`,
            relatedId: verification.id,
            source: "system",
          });
          await prisma.user.update({
            where: { id: paymentRequest.user.referrerId },
            data: {
              referralEarnings: { increment: rewardAmount },
            },
          });
          await prisma.referralVerification.update({
            where: { id: verification.id },
            data: { rewardPaid: true, rewardAmount, isVerified: true },
          });
        }
      }

      await createNotification(
        paymentRequest.userId,
        "Plan Activated",
        `Your ${paymentRequest.plan.name} plan has been successfully activated.`
      );

      await createAuditLog({
        adminId: admin.id,
        action: "PAYMENT_APPROVED",
        targetUserId: paymentRequest.userId,
        newValue: paymentRequest.plan.name,
        ipAddress: ip,
      });
    } else if (action === "reject") {
      await prisma.paymentRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          rejectionReason: rejectionReason || "Payment verification failed",
          reviewedBy: admin.id,
          reviewedAt: new Date(),
        },
      });

      await prisma.userPlan.updateMany({
        where: {
          userId: paymentRequest.userId,
          planId: paymentRequest.planId,
          status: "PENDING",
        },
        data: { status: "REJECTED" },
      });

      await createNotification(
        paymentRequest.userId,
        "Payment Rejected",
        rejectionReason ||
          "Your payment request was rejected. Please contact support."
      );

      await createAuditLog({
        adminId: admin.id,
        action: "PAYMENT_REJECTED",
        targetUserId: paymentRequest.userId,
        newValue: rejectionReason,
        ipAddress: ip,
      });
    } else {
      return apiError("Invalid action", 400);
    }

    broadcastConfigUpdate({ type: "payment_processed" });
    return apiSuccess({ message: `Payment ${action}d successfully` });
  } catch (error) {
    return handleApiError(error);
  }
}
