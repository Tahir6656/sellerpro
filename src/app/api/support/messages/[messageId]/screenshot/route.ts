import { NextRequest, NextResponse } from "next/server";
import { issueSignedToken, presignUrl } from "@vercel/blob";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { apiError, handleApiError } from "@/lib/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session) return apiError("Authentication required", 401);

    const { messageId } = await params;
    const message = await prisma.supportMessage.findUnique({
      where: { id: messageId },
      select: {
        screenshotPath: true,
        conversation: { select: { userId: true } },
      },
    });

    if (!message?.screenshotPath) return apiError("Support image not found", 404);
    if (session.role !== "ADMIN" && message.conversation.userId !== session.id) {
      return apiError("Support image not found", 404);
    }

    const pathname = message.screenshotPath.startsWith("http")
      ? new URL(message.screenshotPath).pathname.replace(/^\/+/, "")
      : message.screenshotPath.replace(/^\/+/, "");
    if (!pathname) return apiError("Support image not found", 404);

    const validUntil = Date.now() + 60 * 1000;
    const signedToken = await issueSignedToken({
      pathname,
      operations: ["get"],
      validUntil,
    });
    const { presignedUrl } = await presignUrl(signedToken, {
      operation: "get",
      pathname,
      validUntil,
      access: "private",
    });

    return NextResponse.redirect(presignedUrl);
  } catch (error) {
    return handleApiError(error);
  }
}
