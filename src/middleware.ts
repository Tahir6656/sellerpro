import { NextRequest, NextResponse } from "next/server";
import { getEdgeSession, getMaintenanceEnabled } from "@/lib/auth-edge";

const AUTH_PATHS = ["/login", "/register", "/forgot-password"];

const PUBLIC_PATHS = [
  ...AUTH_PATHS,
  "/maintenance",
  "/api/auth",
  "/api/config/public",
  "/api/events",
  "/api/plans/public",
];

const ADMIN_PATHS = ["/admin", "/api/admin"];

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const refCode = searchParams.get("ref");

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/uploads") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const session = await getEdgeSession(request);
  const isAdmin = session?.role === "ADMIN";

  // Referral link: ALWAYS logout existing user and show create-account page
  if (refCode) {
    const registerPath = `/register?ref=${encodeURIComponent(refCode)}`;

    if (session) {
      const logoutUrl = new URL("/api/auth/logout", request.url);
      logoutUrl.searchParams.set("redirect", registerPath);
      return NextResponse.redirect(logoutUrl);
    }

    if (pathname !== "/register") {
      return NextResponse.redirect(new URL(registerPath, request.url));
    }

    return NextResponse.next();
  }

  // Root → login or dashboard
  if (pathname === "/") {
    if (session) {
      return NextResponse.redirect(
        new URL(isAdmin ? "/admin" : "/dashboard/plans", request.url)
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isAdminPath = ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isApiAuth = pathname.startsWith("/api/auth");

  // Already logged in → skip auth pages
  if (session && AUTH_PATHS.includes(pathname)) {
    return NextResponse.redirect(
      new URL(isAdmin ? "/admin" : "/dashboard/plans", request.url)
    );
  }

  let maintenanceEnabled = false;
  if (!isPublic && pathname !== "/api/config/public") {
    maintenanceEnabled = await getMaintenanceEnabled(request);
  }

  if (maintenanceEnabled && !isAdmin && !isPublic && !isApiAuth) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Site under maintenance" },
        { status: 503 }
      );
    }
    if (!pathname.startsWith("/maintenance")) {
      return NextResponse.redirect(new URL("/maintenance", request.url));
    }
  }

  if (isAdminPath) {
    if (!session || session.role !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  const protectedUserPaths = [
    "/dashboard",
    "/api/user",
    "/api/payments",
    "/api/withdrawals",
    "/api/notifications",
  ];
  const isProtected = protectedUserPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isProtected && !session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
