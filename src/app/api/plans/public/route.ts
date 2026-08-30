import prisma from "@/lib/db";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { isVisible: true, isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return apiSuccess(plans);
  } catch (error) {
    return handleApiError(error);
  }
}
