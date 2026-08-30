import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { saveUpload } from "@/lib/upload";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { createNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) return apiError("Authentication required", 401);

    if (session.accountStatus === "FROZEN") {
      return apiError("Account is frozen", 403);
    }

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) return apiError("User not found", 404);

    const pendingPayment = await prisma.paymentRequest.findFirst({
      where: { userId: session.id, status: "PENDING" },
    });
    if (pendingPayment) {
      return apiError("You already have a pending payment request", 400);
    }

    const formData = await request.formData();
    const planId = formData.get("planId") as string;
    const paymentAccountId = formData.get("paymentAccountId") as string;
    const screenshot = formData.get("screenshot") as File;

    if (!planId || !paymentAccountId || !screenshot) {
      return apiError("Plan, payment account, and screenshot are required", 400);
    }

    const plan = await prisma.plan.findFirst({
      where: { id: planId, isActive: true },
    });
    if (!plan) return apiError("Plan not found or inactive", 404);

    const account = await prisma.paymentAccount.findFirst({
      where: { id: paymentAccountId, isActive: true },
    });
    if (!account) return apiError("Payment account not found", 404);

    const screenshotPath = await saveUpload(screenshot, "payments");

    const paymentRequest = await prisma.paymentRequest.create({
      data: {
        userId: session.id,
        planId: plan.id,
        paymentAccountId: account.id,
        amount: plan.investment,
        screenshotPath,
      },
    });

    await prisma.userPlan.create({
      data: {
        userId: session.id,
        planId: plan.id,
        amount: plan.investment,
        status: "PENDING",
      },
    });

    await createNotification(
      session.id,
      "Payment Submitted",
      `Your payment request for ${plan.name} has been submitted and is pending verification.`
    );

    return apiSuccess({
      message:
        "Payment request submitted. Please wait for administrator verification.",
      paymentRequest,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return apiError("Authentication required", 401);

    const requests = await prisma.paymentRequest.findMany({
      where: { userId: session.id },
      include: { plan: true, paymentAccount: true },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(requests);
  } catch (error) {
    return handleApiError(error);
  }
}
