/**
 * Reusable API middleware helpers for authentication & role checks
 */
import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken, JWTPayload } from "./auth";

export type AuthedRequest = NextRequest & { user: JWTPayload };

/** Verifies the request token and returns the user payload, or a 401 response */
export function requireAuth(
    req: NextRequest
): { user: JWTPayload } | NextResponse {
    const token = getTokenFromRequest(req);
    if (!token) {
        return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
        );
    }
    const user = verifyToken(token);
    if (!user) {
        return NextResponse.json(
            { error: "Invalid or expired token" },
            { status: 401 }
        );
    }
    return { user };
}

/** Same as requireAuth but also enforces admin role */
export function requireAdmin(
    req: NextRequest
): { user: JWTPayload } | NextResponse {
    const result = requireAuth(req);
    if (result instanceof NextResponse) return result;
    if (result.user.role !== "admin") {
        return NextResponse.json(
            { error: "Admin access required" },
            { status: 403 }
        );
    }
    return result;
}

/** Standardised success response */
export function ok<T>(data: T, status = 200): NextResponse {
    return NextResponse.json(data, { status });
}

/** Standardised error response */
export function err(message: string, status = 400): NextResponse {
    return NextResponse.json({ error: message }, { status });
}
