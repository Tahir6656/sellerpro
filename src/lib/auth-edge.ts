import { jwtVerify } from "jose";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-dev-secret-change-me";
export const COOKIE_NAME = "sellerpro_session";

export interface EdgeSession {
  userId: string;
  role: "USER" | "ADMIN";
}
export async function getEdgeSession(
  request: NextRequest
): Promise<EdgeSession | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;
    const role = payload.role as "USER" | "ADMIN";
    if (!userId || !role) return null;
    return { userId, role };
  } catch {
    return null;
  }
}
export async function getMaintenanceEnabled(
  request: NextRequest
): Promise<boolean> {
  try {
    const url = new URL("/api/config/public", request.url);
    const res = await fetch(url, {
      headers: { "x-middleware-check": "1" },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const json = await res.json();
    return json?.data?.config?.maintenance_enabled === "true";
  } catch {
    return false;
  }
}
