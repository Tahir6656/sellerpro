import prisma from "./db";
import type { TransactionType, TransactionStatus } from "@prisma/client";

interface CreateTransactionParams {
  userId: string;
  type: TransactionType;
  amount: number;
  description?: string;
  relatedId?: string;
  source?: string;
  status?: TransactionStatus;
}

export async function createTransaction(params: CreateTransactionParams) {
  const { userId, type, amount, description, relatedId, source, status } =
    params;

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    const previousBalance = user.balance;
    let newBalance = previousBalance;

    if (type === "WITHDRAWAL") {
      newBalance = previousBalance - amount;
    } else if (
      type === "DEPOSIT" ||
      type === "REFERRAL_REWARD" ||
      type === "REFUND" ||
      type === "ADJUSTMENT"
    ) {
      newBalance = previousBalance + amount;
    }

    if (newBalance < 0) {
      throw new Error("Insufficient balance");
    }

    await tx.user.update({
      where: { id: userId },
      data: { balance: newBalance },
    });

    return tx.transaction.create({
      data: {
        userId,
        type,
        amount,
        previousBalance,
        newBalance,
        description,
        relatedId,
        source,
        status: status || "COMPLETED",
      },
    });
  });
}

export async function accruePlanReturn(userPlanId: string, now = new Date()) {
  return prisma.$transaction(async (tx) => {
    const userPlan = await tx.userPlan.findUnique({
      where: { id: userPlanId },
      include: { plan: true },
    });

    if (
      !userPlan ||
      userPlan.status !== "APPROVED" ||
      !userPlan.startDate ||
      userPlan.plan.durationDays <= 0
    ) {
      return 0;
    }

    const elapsedDays = Math.min(
      userPlan.plan.durationDays,
      Math.floor((now.getTime() - userPlan.startDate.getTime()) / 86400000)
    );
    if (elapsedDays <= 0) return 0;

    const returnTransactions = await tx.transaction.findMany({
      where: {
        userId: userPlan.userId,
        type: "PLAN_RETURN",
        relatedId: { startsWith: `${userPlan.id}:day:` },
      },
      select: { amount: true, relatedId: true },
    });
    const paidDays = new Set(
      returnTransactions.map((transaction) => transaction.relatedId)
    );
    const credited = returnTransactions.reduce(
      (total, transaction) => total + transaction.amount,
      0
    );
    let remaining = Math.max(0, userPlan.plan.statedReturn - credited);
    let creditedNow = 0;
    const dailyReturn = userPlan.plan.statedReturn / userPlan.plan.durationDays;

    for (let day = 1; day <= elapsedDays && remaining > 0.0000001; day++) {
      const relatedId = `${userPlan.id}:day:${day}`;
      if (paidDays.has(relatedId)) continue;

      const amount = Math.min(dailyReturn, remaining);
      await tx.user.update({
        where: { id: userPlan.userId },
        data: { balance: { increment: amount } },
      });
      const user = await tx.user.findUniqueOrThrow({
        where: { id: userPlan.userId },
        select: { balance: true },
      });
      await tx.transaction.create({
        data: {
          userId: userPlan.userId,
          type: "PLAN_RETURN",
          amount,
          previousBalance: user.balance - amount,
          newBalance: user.balance,
          description: `Daily return: ${userPlan.plan.name} (day ${day})`,
          relatedId,
          source: "system",
        },
      });
      remaining -= amount;
      creditedNow += amount;
    }

    return creditedNow;
  });
}

export async function getUserTransactions(userId: string, limit = 50) {
  return prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
