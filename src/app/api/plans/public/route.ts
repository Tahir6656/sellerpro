import prisma from "@/lib/db";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { ensureDefaultPlansExist } from "@/lib/default-plans";

export async function GET() {
  try {
    await ensureDefaultPlansExist();
    const plans = await prisma.plan.findMany({
      where: { isVisible: true, isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return apiSuccess(plans);
  } catch (error) {
    return handleApiError(error);
  }
}
