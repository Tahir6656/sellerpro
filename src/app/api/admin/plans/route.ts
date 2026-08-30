import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { planSchema } from "@/lib/validators";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { broadcastConfigUpdate } from "@/lib/events";
import { getClientIp } from "@/lib/rate-limit";

export async function GET() {
  try {
    await requireAuth("ADMIN");
    const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
    return apiSuccess(plans);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuth("ADMIN");
    const body = await request.json();
    const parsed = planSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400);
    }

    const plan = await prisma.plan.create({ data: parsed.data });

    await createAuditLog({
      adminId: admin.id,
      action: "PLAN_CREATED",
      newValue: plan.name,
      ipAddress: getClientIp(request),
    });

    broadcastConfigUpdate({ type: "plans_updated" });
    return apiSuccess(plan);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAuth("ADMIN");
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return apiError("Plan ID required", 400);

    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) return apiError("Plan not found", 404);

    const plan = await prisma.plan.update({ where: { id }, data });

    await createAuditLog({
      adminId: admin.id,
      action: "PLAN_UPDATED",
      previousValue: JSON.stringify(existing),
      newValue: JSON.stringify(plan),
      ipAddress: getClientIp(request),
    });

    broadcastConfigUpdate({ type: "plans_updated" });
    return apiSuccess(plan);
  } catch (error) {
    return handleApiError(error);
  }
}
