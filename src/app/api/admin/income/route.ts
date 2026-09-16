import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    await requireAuth("ADMIN");

    const users = await prisma.user.findMany({
      where: { role: "USER" },
      select: { id: true, username: true },
    });
    const userIds = users.map((user) => user.id);

    const [payments, withdrawals, referrals] = await Promise.all([
      prisma.paymentRequest.findMany({ where: { userId: { in: userIds }, status: "APPROVED" }, select: { userId: true, amount: true } }),
      prisma.withdrawalRequest.findMany({ where: { userId: { in: userIds }, status: { in: ["APPROVED", "COMPLETED"] } }, select: { userId: true, amount: true } }),
      prisma.transaction.findMany({ where: { userId: { in: userIds }, type: "REFERRAL_REWARD", status: "COMPLETED" }, select: { userId: true, amount: true } }),
    ]);

    const usersReport = users.map((user) => {
      const totalInvestments = payments.filter((item) => item.userId === user.id).reduce((sum, item) => sum + item.amount, 0);
      const totalWithdrawals = withdrawals.filter((item) => item.userId === user.id).reduce((sum, item) => sum + item.amount, 0);
      const totalReferralRewards = referrals.filter((item) => item.userId === user.id).reduce((sum, item) => sum + item.amount, 0);
      return { username: user.username, totalInvestments, investmentCount: payments.filter((item) => item.userId === user.id).length, totalWithdrawals, withdrawalCount: withdrawals.filter((item) => item.userId === user.id).length, totalReferralRewards, referralRewardCount: referrals.filter((item) => item.userId === user.id).length, remainingAmount: totalInvestments - totalWithdrawals - totalReferralRewards };
    });

    const totals = usersReport.reduce((result, user) => ({ totalInvestments: result.totalInvestments + user.totalInvestments, totalWithdrawals: result.totalWithdrawals + user.totalWithdrawals, totalReferralRewards: result.totalReferralRewards + user.totalReferralRewards, investmentCount: result.investmentCount + user.investmentCount, withdrawalCount: result.withdrawalCount + user.withdrawalCount, referralRewardCount: result.referralRewardCount + user.referralRewardCount }), { totalInvestments: 0, totalWithdrawals: 0, totalReferralRewards: 0, investmentCount: 0, withdrawalCount: 0, referralRewardCount: 0 });

    return apiSuccess({
      ...totals,
      remainingAmount: totals.totalInvestments - totals.totalWithdrawals - totals.totalReferralRewards,
      users: usersReport,
    });
  } catch (error) {
    return handleApiError(error);
  }
}