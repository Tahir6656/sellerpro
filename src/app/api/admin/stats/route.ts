import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    await requireAuth("ADMIN");

    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);

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

    const transactions = await prisma.transaction.findMany({
      where: { createdAt: { gte: since } },
      select: { type: true, amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    const transactionChart = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(since);
      date.setDate(since.getDate() + index);
      const key = date.toISOString().slice(0, 10);
      const day = transactions.filter((transaction) => transaction.createdAt.toISOString().slice(0, 10) === key);
      return {
        date: key,
        deposits: day.filter((transaction) => ["DEPOSIT", "PLAN_RETURN", "REFERRAL_REWARD"].includes(transaction.type)).reduce((sum, transaction) => sum + transaction.amount, 0),
        withdrawals: day.filter((transaction) => transaction.type === "WITHDRAWAL").reduce((sum, transaction) => sum + transaction.amount, 0),
      };
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
      transactionChart,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
