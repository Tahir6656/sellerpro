import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    await requireAuth("ADMIN");

    const [approvedPayments, acceptedWithdrawals, referralRewards] = await Promise.all([
      prisma.paymentRequest.aggregate({
        _sum: { amount: true },
        _count: { _all: true },
        where: { status: "APPROVED" },
      }),
      prisma.withdrawalRequest.aggregate({
        _sum: { amount: true },
        _count: { _all: true },
        where: { status: { in: ["APPROVED", "COMPLETED"] } },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        _count: { _all: true },
        where: { type: "REFERRAL_REWARD", status: "COMPLETED" },
      }),
    ]);

    const totalInvestments = approvedPayments._sum.amount || 0;
    const totalWithdrawals = acceptedWithdrawals._sum.amount || 0;
    const totalReferralRewards = referralRewards._sum.amount || 0;

    return apiSuccess({
      totalInvestments,
      investmentCount: approvedPayments._count._all,
      totalWithdrawals,
      withdrawalCount: acceptedWithdrawals._count._all,
      totalReferralRewards,
      referralRewardCount: referralRewards._count._all,
      remainingAmount: totalInvestments - totalWithdrawals - totalReferralRewards,
    });
  } catch (error) {
    return handleApiError(error);
  }
}