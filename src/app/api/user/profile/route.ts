import { NextRequest } from "next/server";
import { getSessionUser, hashPassword, verifyPassword } from "@/lib/auth";
import prisma from "@/lib/db";
import { changePasswordSchema } from "@/lib/validators";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { getUserTransactions } from "@/lib/transactions";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return apiError("Authentication required", 401);

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        username: true,
        email: true,
        mobile: true,
        balance: true,
        referralCode: true,
        referralEarnings: true,
        accountStatus: true,
        registrationDate: true,
        lastLogin: true,
      },
    });

    const planHistory = await prisma.userPlan.findMany({
      where: { userId: session.id },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    const depositHistory = await prisma.paymentRequest.findMany({
      where: { userId: session.id },
      include: { plan: true, paymentAccount: true },
      orderBy: { createdAt: "desc" },
    });

    const withdrawalHistory = await prisma.withdrawalRequest.findMany({
      where: { userId: session.id },
      include: { method: true },
      orderBy: { createdAt: "desc" },
    });

    const transactions = await getUserTransactions(session.id);

    return apiSuccess({
      user,
      planHistory,
      depositHistory,
      withdrawalHistory,
      transactions,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) return apiError("Authentication required", 401);

    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400);
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.id },
    });

    const valid = await verifyPassword(
      parsed.data.currentPassword,
      user.passwordHash
    );
    if (!valid) return apiError("Current password is incorrect", 400);

    const passwordHash = await hashPassword(parsed.data.newPassword);
    await prisma.user.update({
      where: { id: session.id },
      data: { passwordHash },
    });

    return apiSuccess({ message: "Password updated successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
