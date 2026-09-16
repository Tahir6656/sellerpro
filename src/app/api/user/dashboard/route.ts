import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { accruePlanReturn } from "@/lib/transactions";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return apiError("Authentication required", 401);

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        activePlan: { include: { plan: true } },
        userPlans: {
          include: { plan: true },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        referrer: { select: { username: true } },
      },
    });

    if (!user) return apiError("User not found", 404);

    const activePlans = user.userPlans.filter(
      (plan) => plan.status === "APPROVED"
    );

    for (const activePlan of activePlans) {
      await accruePlanReturn(activePlan.id);
    }

    user.balance = (
      await prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { balance: true },
      })
    ).balance;

    const [pendingPayment, approvedDeposits, completedWithdrawals, pendingWithdrawals] = await Promise.all([
      prisma.paymentRequest.findFirst({
        where: { userId: user.id, status: "PENDING" },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.paymentRequest.aggregate({
        where: { userId: user.id, status: "APPROVED" },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.withdrawalRequest.aggregate({
        where: { userId: user.id, status: "COMPLETED" },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.withdrawalRequest.count({
        where: { userId: user.id, status: { in: ["PENDING", "APPROVED"] } },
      }),
    ]);

    const pendingPlan = user.userPlans.find((p) => p.status === "PENDING");

    return apiSuccess({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        balance: user.balance,
        accountStatus: user.accountStatus,
        referralCode: user.referralCode,
        referralEarnings: user.referralEarnings,
        referrer: user.referrer,
        registrationDate: user.registrationDate,
      },
      activePlan: activePlans[0] ?? user.activePlan,
      activePlans,
      pendingPlan,
      pendingPayment,
      summary: {
        totalDeposits: approvedDeposits._sum.amount || 0,
        depositCount: approvedDeposits._count._all,
        totalWithdrawals: completedWithdrawals._sum.amount || 0,
        withdrawalCount: completedWithdrawals._count._all,
        pendingWithdrawals,
        referralEarnings: user.referralEarnings,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
