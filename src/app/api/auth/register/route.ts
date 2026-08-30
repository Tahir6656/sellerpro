import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import {
  hashPassword,
  createToken,
  applySessionCookie,
  generateReferralCode,
} from "@/lib/auth";
import { registerSchema, normalizeMobile } from "@/lib/validators";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { createNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400);
    }

    const { username, email, mobile, password, referralCode } = parsed.data;
    const normalizedMobile = normalizeMobile(mobile);

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
          { mobile: normalizedMobile },
        ],
      },
    });
    if (existing) {
      return apiError("Username, email, or mobile already exists", 409);
    }

    let referrerId: string | undefined;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode },
      });
      if (referrer) referrerId = referrer.id;
    }

    const passwordHash = await hashPassword(password);
    let code = generateReferralCode();
    while (await prisma.user.findUnique({ where: { referralCode: code } })) {
      code = generateReferralCode();
    }

    const user = await prisma.user.create({
      data: {
        username,
        email,
        mobile: normalizedMobile,
        passwordHash,
        referralCode: code,
        referrerId,
      },
    });

    if (referrerId) {
      await prisma.referralVerification.create({
        data: {
          referrerId,
          referredId: user.id,
        },
      });
      await createNotification(
        referrerId,
        "New Referral",
        `${username} registered using your referral link.`
      );
    }

    const token = await createToken(user.id, user.role);

    const response = apiSuccess({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
    applySessionCookie(response, token);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
