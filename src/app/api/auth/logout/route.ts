/**
 * POST /api/auth/logout
 * Clears the auth cookie
 */
import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";

export async function POST() {
    const response = NextResponse.json({ message: "Logged out" });
    response.cookies.set(COOKIE_NAME, "", {
        httpOnly: true,
        maxAge: 0,
        path: "/",
    });
    return response;
}
