import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getAuditLogs } from "@/lib/audit";

export async function GET() {
  try {
    await requireAuth("ADMIN");
    const logs = await getAuditLogs(200);
    return apiSuccess(logs);
  } catch (error) {
    return handleApiError(error);
  }
}
