import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { withdrawalSchema } from "@/lib/validators";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { createNotification } from "@/lib/notifications";
import { getConfig } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) return apiError("Authentication required", 401);

    if (session.accountStatus === "FROZEN") {
      return apiError("Account is frozen", 403);
    }

    const body = await request.json();
    const parsed = withdrawalSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400);
    }

    const { methodId, accountNumber, accountHolder, amount } = parsed.data;

    const method = await prisma.withdrawalMethod.findFirst({
      where: { id: methodId, isActive: true },
    });
    if (!method) return apiError("Withdrawal method not found", 404);

    const minWithdrawal = parseFloat(await getConfig("min_withdrawal")) || 300;
    const maxWithdrawal =
      parseFloat(await getConfig("max_withdrawal")) || 100000;

    if (amount < method.minAmount || amount < minWithdrawal) {
      return apiError(`Minimum withdrawal is ${method.minAmount}`, 400);
    }
    if (amount > method.maxAmount || amount > maxWithdrawal) {
      return apiError(`Maximum withdrawal is ${method.maxAmount}`, 400);
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.id },
    });

    if (user.balance < amount) {
      return apiError("Insufficient balance", 400);
    }

    const pending = await prisma.withdrawalRequest.findFirst({
      where: { userId: session.id, status: "PENDING" },
    });
    if (pending) {
      return apiError("You already have a pending withdrawal request", 400);
    }

    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        userId: session.id,
        methodId,
        accountNumber,
        accountHolder,
        amount,
      },
    });

    await createNotification(
      session.id,
      "Withdrawal Submitted",
      `Your withdrawal request of ${amount} has been submitted for verification.`
    );

    return apiSuccess({
      message:
        "Withdrawal request submitted. Please wait for verification.",
      withdrawal,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return apiError("Authentication required", 401);

    const minWithdrawal = parseFloat(await getConfig("min_withdrawal")) || 300;

    const methods = await prisma.withdrawalMethod.findMany({
      where: { isActive: true },
    });

    // Ensure the returned minAmount reflects the configured global minimum
    const adjustedMethods = methods.map((m) => ({
      ...m,
      minAmount: Math.max(m.minAmount, minWithdrawal),
    }));

    const requests = await prisma.withdrawalRequest.findMany({
      where: { userId: session.id },
      include: { method: true },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ methods: adjustedMethods, requests });
  } catch (error) {
    return handleApiError(error);
  }
}
