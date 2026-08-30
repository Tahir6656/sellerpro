import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { paymentAccountSchema } from "@/lib/validators";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { broadcastConfigUpdate } from "@/lib/events";
import { getClientIp } from "@/lib/rate-limit";

export async function GET() {
  try {
    await requireAuth("ADMIN");
    const accounts = await prisma.paymentAccount.findMany({
      orderBy: { createdAt: "desc" },
    });
    return apiSuccess(accounts);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuth("ADMIN");
    const body = await request.json();
    const parsed = paymentAccountSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400);
    }

    const account = await prisma.paymentAccount.create({ data: parsed.data });

    await createAuditLog({
      adminId: admin.id,
      action: "PAYMENT_ACCOUNT_CREATED",
      newValue: JSON.stringify(account),
      ipAddress: getClientIp(request),
    });

    try {
      broadcastConfigUpdate({ type: "payment_accounts_updated" });
    } catch {
      // live updates must never block admin saves
    }
    return apiSuccess(account);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAuth("ADMIN");
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return apiError("Account ID required", 400);

    const existing = await prisma.paymentAccount.findUnique({ where: { id } });
    if (!existing) return apiError("Account not found", 404);

    const account = await prisma.paymentAccount.update({
      where: { id },
      data: {
        methodName: data.methodName,
        accountHolder: data.accountHolder,
        accountNumber: data.accountNumber,
        mobileId: data.mobileId ?? null,
        instructions: data.instructions ?? null,
        isActive: data.isActive ?? true,
      },
    });

    await createAuditLog({
      adminId: admin.id,
      action: "PAYMENT_ACCOUNT_UPDATED",
      previousValue: JSON.stringify(existing),
      newValue: JSON.stringify(account),
      ipAddress: getClientIp(request),
    });

    try {
      broadcastConfigUpdate({ type: "payment_accounts_updated" });
    } catch {
      // live updates must never block admin saves
    }
    return apiSuccess(account);
  } catch (error) {
    return handleApiError(error);
  }
}
