import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    await requireAuth("ADMIN");

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");

    const users = await prisma.user.findMany({
      where: {
        role: "USER",
        ...(search
          ? {
              OR: [
                { username: { contains: search } },
                { email: { contains: search } },
                { mobile: { contains: search } },
              ],
            }
          : {}),
        ...(status ? { accountStatus: status as "ACTIVE" | "FROZEN" | "DEACTIVATED" } : {}),
      },
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
      take: 100,
    });

    return apiSuccess(users);
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
