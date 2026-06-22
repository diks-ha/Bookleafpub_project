/**
 * GET /api/admin/authors
 * Returns all authors with their books. Admin only.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const auth = requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const authors = await prisma.author.findMany({
        include: {
            user: { select: { email: true } },
            books: {
                select: {
                    id: true,
                    title: true,
                    status: true,
                    totalCopiesSold: true,
                    royaltyPending: true,
                },
                orderBy: { publicationDate: "desc" },
            },
        },
        orderBy: { name: "asc" },
    });

    return NextResponse.json({ authors });
}
