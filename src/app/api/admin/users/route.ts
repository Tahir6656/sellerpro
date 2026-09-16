import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { createTransaction } from "@/lib/transactions";

export async function GET(request: NextRequest) {
  try {
    await requireAuth("ADMIN");

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize")) || 20));
    const where = {
      role: "USER" as const,
      ...(search ? { OR: [{ username: { contains: search } }, { email: { contains: search } }, { mobile: { contains: search } }] } : {}),
      ...(status ? { accountStatus: status as "ACTIVE" | "FROZEN" | "DEACTIVATED" } : {}),
    };

    const [users, total] = await Promise.all([prisma.user.findMany({
      where,
      include: {
        activePlan: { include: { plan: true } },
        referrer: { select: { username: true } },
        _count: {
          select: {
            referrals: true,
            paymentRequests: true,
            withdrawalRequests: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }), prisma.user.count({ where })]);

    return apiSuccess({ items: users, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAuth("ADMIN");
    const body = await request.json();
    const { userId, action, reason } = body;

    if (!userId || !action) {
      return apiError("User ID and action required", 400);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role === "ADMIN") {
      return apiError("User not found", 404);
    }

    const ip = getClientIp(request);
    const ua = request.headers.get("user-agent") || undefined;

    if (action === "adjust-balance") {
      const amount = Number(body.amount);
      const adjustmentReason = typeof reason === "string" ? reason.trim() : "";

      if (!Number.isFinite(amount) || amount === 0) {
        return apiError("A non-zero balance amount is required", 400);
      }
      if (!adjustmentReason || adjustmentReason.length > 500) {
        return apiError("A reason up to 500 characters is required", 400);
      }

      try {
        const transaction = await createTransaction({
          userId,
          type: "ADJUSTMENT",
          amount,
          description: `Admin balance adjustment: ${adjustmentReason}`,
          source: admin.id,
        });

        await createAuditLog({
          adminId: admin.id,
          action: "USER_BALANCE_ADJUSTED",
          targetUserId: userId,
          previousValue: String(transaction.previousBalance),
          newValue: `${transaction.newBalance}: ${adjustmentReason}`,
          ipAddress: ip,
          userAgent: ua,
        });

        return apiSuccess({
          message: `Balance ${amount > 0 ? "added" : "removed"} successfully`,
        });
      } catch (error) {
        if (error instanceof Error && error.message === "Insufficient balance") {
          return apiError("Balance cannot be negative", 400);
        }
        throw error;
      }
    }

    let newStatus = user.accountStatus;
    let auditAction = action;

    switch (action) {
      case "freeze":
        newStatus = "FROZEN";
        auditAction = "USER_FROZEN";
        break;
      case "unfreeze":
        newStatus = "ACTIVE";
        auditAction = "USER_UNFROZEN";
        break;
      case "deactivate":
        newStatus = "DEACTIVATED";
        auditAction = "USER_DEACTIVATED";
        break;
      case "reactivate":
        newStatus = "ACTIVE";
        auditAction = "USER_REACTIVATED";
        break;
      default:
        return apiError("Invalid action", 400);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { accountStatus: newStatus },
    });

    await createAuditLog({
      adminId: admin.id,
      action: auditAction,
      targetUserId: userId,
      previousValue: user.accountStatus,
      newValue: newStatus + (reason ? `: ${reason}` : ""),
      ipAddress: ip,
      userAgent: ua,
    });

    return apiSuccess({ message: `User ${action} successful` });
  } catch (error) {
    return handleApiError(error);
  }
}
