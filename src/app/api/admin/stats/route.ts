import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    await requireAuth("ADMIN");

    const [
      totalUsers,
      activeUsers,
      frozenUsers,
      deactivatedUsers,
      activePlans,
      pendingPlans,
      pendingDeposits,
      pendingWithdrawals,
      totalReferrals,
      pendingPasswordResets,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),
      prisma.user.count({
        where: { role: "USER", accountStatus: "ACTIVE" },
      }),
      prisma.user.count({
        where: { role: "USER", accountStatus: "FROZEN" },
      }),
      prisma.user.count({
        where: { role: "USER", accountStatus: "DEACTIVATED" },
      }),
      prisma.userPlan.count({ where: { status: "APPROVED" } }),
      prisma.userPlan.count({ where: { status: "PENDING" } }),
      prisma.paymentRequest.count({ where: { status: "PENDING" } }),
      prisma.withdrawalRequest.count({ where: { status: "PENDING" } }),
      prisma.referralVerification.count(),
      prisma.passwordResetRequest.count({ where: { status: "PENDING" } }),
    ]);

    const totalBalance = await prisma.user.aggregate({
      _sum: { balance: true },
      where: { role: "USER" },
    });

    return apiSuccess({
      totalUsers,
      activeUsers,
      frozenUsers,
      deactivatedUsers,
      activePlans,
      pendingPlans,
      pendingDeposits,
      pendingWithdrawals,
      totalReferrals,
      pendingPasswordResets,
      totalBalance: totalBalance._sum.balance || 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
