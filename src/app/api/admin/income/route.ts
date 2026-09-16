import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getConfig, setConfig } from "@/lib/config";

const INCOME_USERNAMES = ["waqar", "ZainAbbas", "Raees", "Malik", "AhsanNawaz"];

export async function GET() {
  try {
    await requireAuth("ADMIN");

    let startValue = await getConfig("income_calculation_start");
    if (!startValue) {
      startValue = new Date().toISOString();
      await setConfig("income_calculation_start", startValue);
    }
    const startDate = new Date(startValue);
    const users = await prisma.user.findMany({
      where: { role: "USER" },
      select: { id: true, username: true },
    });
    const selectedUsers = users.filter((user) => INCOME_USERNAMES.includes(user.username));
    const selectedIds = selectedUsers.map((user) => user.id);

    const [payments, withdrawals, referrals] = await Promise.all([
      prisma.paymentRequest.findMany({ where: { userId: { in: selectedIds }, status: "APPROVED", createdAt: { gte: startDate } }, select: { userId: true, amount: true } }),
      prisma.withdrawalRequest.findMany({ where: { userId: { in: selectedIds }, status: { in: ["APPROVED", "COMPLETED"] }, createdAt: { gte: startDate } }, select: { userId: true, amount: true } }),
      prisma.referralVerification.findMany({ where: { referrerId: { in: selectedIds }, rewardPaid: true, updatedAt: { gte: startDate } }, select: { referrerId: true, rewardAmount: true } }),
    ]);

    const usersReport = selectedUsers.map((user) => {
      const totalInvestments = payments.filter((item) => item.userId === user.id).reduce((sum, item) => sum + item.amount, 0);
      const totalWithdrawals = withdrawals.filter((item) => item.userId === user.id).reduce((sum, item) => sum + item.amount, 0);
      const totalReferralRewards = referrals.filter((item) => item.referrerId === user.id).reduce((sum, item) => sum + item.rewardAmount, 0);
      return { username: user.username, totalInvestments, investmentCount: payments.filter((item) => item.userId === user.id).length, totalWithdrawals, withdrawalCount: withdrawals.filter((item) => item.userId === user.id).length, totalReferralRewards, referralRewardCount: referrals.filter((item) => item.referrerId === user.id).length, remainingAmount: totalInvestments - totalWithdrawals - totalReferralRewards };
    });

    const totals = usersReport.reduce((result, user) => ({ totalInvestments: result.totalInvestments + user.totalInvestments, totalWithdrawals: result.totalWithdrawals + user.totalWithdrawals, totalReferralRewards: result.totalReferralRewards + user.totalReferralRewards, investmentCount: result.investmentCount + user.investmentCount, withdrawalCount: result.withdrawalCount + user.withdrawalCount, referralRewardCount: result.referralRewardCount + user.referralRewardCount }), { totalInvestments: 0, totalWithdrawals: 0, totalReferralRewards: 0, investmentCount: 0, withdrawalCount: 0, referralRewardCount: 0 });

    return apiSuccess({
      ...totals,
      remainingAmount: totals.totalInvestments - totals.totalWithdrawals - totals.totalReferralRewards,
      startDate: startValue,
      users: usersReport,
    });
  } catch (error) {
    return handleApiError(error);
  }
}