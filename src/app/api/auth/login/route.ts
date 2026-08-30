import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import {
  verifyPassword,
  createToken,
  applySessionCookie,
} from "@/lib/auth";
import { loginSchema, normalizeMobile } from "@/lib/validators";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400);
    }

    const normalizedMobile = normalizeMobile(parsed.data.mobile);
    const user = await prisma.user.findUnique({
      where: { mobile: normalizedMobile },
    });

    if (!user) return apiError("Invalid credentials", 401);

    if (user.accountStatus === "DEACTIVATED") {
      return apiError("Account has been deactivated", 403);
    }

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) return apiError("Invalid credentials", 401);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const token = await createToken(user.id, user.role);
    const response = apiSuccess({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
      },
    });
    applySessionCookie(response, token);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
