import { getAllConfig } from "@/lib/config";
import prisma from "@/lib/db";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const config = await getAllConfig();
    const plans = await prisma.plan.findMany({
      where: { isVisible: true, isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    const paymentAccounts = await prisma.paymentAccount.findMany({
      where: { isActive: true },
    });

    return apiSuccess({ config, plans, paymentAccounts });
  } catch (error) {
    return handleApiError(error);
  }
}
