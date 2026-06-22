/**
 * GET /api/auth/me
 * Returns the current logged-in user info
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const user = await prisma.user.findUnique({
        where: { id: auth.user.userId },
        include: { author: true },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.author?.name ?? "Admin",
        authorId: user.author?.id ?? null,
        city: user.author?.city ?? null,
        joinedDate: user.author?.joinedDate ?? null,
    });
}
