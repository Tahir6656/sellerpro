import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return apiError("Referral code required", 400);

  const referrer = await prisma.user.findUnique({
    where: { referralCode: code },
    select: { username: true },
  });

  if (!referrer) return apiError("Invalid referral code", 404);

  return apiSuccess({ username: referrer.username });
}
