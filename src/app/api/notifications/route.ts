import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getUserNotifications,
  markNotificationRead,
  getUnreadCount,
} from "@/lib/notifications";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return apiError("Authentication required", 401);

    const notifications = await getUserNotifications(session.id);
    const unreadCount = await getUnreadCount(session.id);

    return apiSuccess({ notifications, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) return apiError("Authentication required", 401);

    const { id } = await request.json();
    if (!id) return apiError("Notification ID required", 400);

    await markNotificationRead(id, session.id);
    return apiSuccess({ message: "Marked as read" });
  } catch (error) {
    return handleApiError(error);
  }
}
