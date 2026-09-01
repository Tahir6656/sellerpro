import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { presignUrl, issueSignedToken } from "@vercel/blob";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    await requireAuth("ADMIN");

    const { requestId } = await params;
    if (!requestId) {
      return apiError("Request ID required", 400);
    }

    const paymentRequest = await prisma.paymentRequest.findUnique({
      where: { id: requestId },
      select: { screenshotPath: true },
    });

    if (!paymentRequest || !paymentRequest.screenshotPath) {
      return apiError("Payment proof not found", 404);
    }

    const rawPath = paymentRequest.screenshotPath;
    const pathname = rawPath.startsWith("http")
      ? new URL(rawPath).pathname.replace(/^\/+/, "")
      : rawPath.replace(/^\/+/, "");

    if (!pathname) {
      return apiError("Payment proof not found", 404);
    }

    const signedToken = await issueSignedToken({
      pathname,
      operations: ["get"],
      validUntil: Date.now() + 60 * 1000,
    });

    const { presignedUrl } = await presignUrl(signedToken, {
      operation: "get",
      pathname,
      validUntil: Date.now() + 60 * 1000,
      access: "private",
    });

    return apiSuccess({ url: presignedUrl });
  } catch (error) {
    return handleApiError(error);
  }
}
