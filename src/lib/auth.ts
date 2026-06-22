/**
 * Auth utilities: JWT creation/verification + password hashing helpers
 */
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = "bl_token";

export interface JWTPayload {
    userId: string;
    role: "author" | "admin";
    email: string;
}

// ── Token helpers ─────────────────────────────────────────────────────────

export function signToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
        return null;
    }
}

// ── Cookie helpers ────────────────────────────────────────────────────────

export async function getTokenFromCookies(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export function getTokenFromRequest(req: NextRequest): string | null {
    // Try Authorization header first (for programmatic clients)
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.slice(7);
    }
    // Fall back to cookie
    return req.cookies.get(COOKIE_NAME)?.value ?? null;
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
    const token = await getTokenFromCookies();
    if (!token) return null;
    return verifyToken(token);
}

// ── Password helpers ──────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export { COOKIE_NAME };
