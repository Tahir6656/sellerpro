import { NextRequest, NextResponse } from "next/server";
import { applyClearSessionCookie } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true, data: { message: "Logged out" } });
  applyClearSessionCookie(response);
  return response;
}

/** GET /api/auth/logout?redirect=/register?ref=CODE — clears session then redirects */
export async function GET(request: NextRequest) {
  const redirect = request.nextUrl.searchParams.get("redirect") || "/login";
  const target = redirect.startsWith("/") ? redirect : "/login";
  const response = NextResponse.redirect(new URL(target, request.url));
  applyClearSessionCookie(response);
  return response;
}
