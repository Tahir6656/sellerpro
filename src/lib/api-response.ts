import { NextResponse } from "next/server";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED")
      return apiError("Authentication required", 401);
    if (error.message === "FORBIDDEN")
      return apiError("Access denied", 403);
    return apiError(error.message, 400);
  }
  return apiError("Internal server error", 500);
}
