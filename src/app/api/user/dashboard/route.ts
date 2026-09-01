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

    const pendingPlan = user.userPlans.find((p) => p.status === "PENDING");
    const pendingPayment = await prisma.paymentRequest.findFirst({
      where: { userId: user.id, status: "PENDING" },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

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
    });
  } catch (error) {
    return handleApiError(error);
  }
}
