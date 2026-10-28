import { NextResponse } from "next/server";

/** Amplop error `04-api-spec.md` §1.1. */
export type ApiErrorCode =
  | "NOT_FOUND"
  | "GONE"
  | "AD_GATE_REQUIRED"
  | "NO_ENTITLEMENT"
  | "RATE_LIMITED"
  | "TOKEN_EXPIRED"
  | "DEPENDENCY_UNAVAILABLE"
  | "VALIDATION_FAILED"
  | "STORAGE_ERROR";

export function apiError(
  code: ApiErrorCode,
  message: string,
  {
    status,
    details,
    requestId,
    headers = {},
  }: {
    status: number;
    details?: Record<string, unknown>;
    requestId?: string;
    headers?: Record<string, string>;
  },
): NextResponse {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}), ...(requestId ? { requestId } : {}) } },
    {
      status,
      headers: { "cache-control": "private, no-store", ...headers },
    },
  );
}

export function requestIdFrom(request: Request): string {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}
