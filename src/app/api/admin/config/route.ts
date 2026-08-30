import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getAllConfig, setMultipleConfig } from "@/lib/config";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { broadcastConfigUpdate } from "@/lib/events";
import { getClientIp } from "@/lib/rate-limit";

export async function GET() {
  try {
    await requireAuth("ADMIN");
    const config = await getAllConfig();
    return apiSuccess(config);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAuth("ADMIN");
    const body = await request.json();

    if (!body || typeof body !== "object") {
      return apiError("Invalid config data", 400);
    }

    await setMultipleConfig(body, admin.id);

    await createAuditLog({
      adminId: admin.id,
      action: "CONFIG_UPDATED",
      newValue: JSON.stringify(Object.keys(body)),
      ipAddress: getClientIp(request),
    });

    broadcastConfigUpdate({ type: "config_updated", keys: Object.keys(body) });
    return apiSuccess({ message: "Configuration updated" });
  } catch (error) {
    return handleApiError(error);
  }
}
