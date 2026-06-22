/**
 * GET /api/author/books
 * Returns the authenticated author's books
 * Role: author only
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    if (auth.user.role !== "author") {
        return NextResponse.json({ error: "Author access only" }, { status: 403 });
    }

    const author = await prisma.author.findUnique({
        where: { userId: auth.user.userId },
        include: {
            books: {
                orderBy: { publicationDate: "desc" },
            },
        },
    });

    if (!author) {
        return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    // Parse availableOn JSON string back to array
    const books = author.books.map((b) => ({
        ...b,
        availableOn: JSON.parse(b.availableOn) as string[],
    }));

    return NextResponse.json({ books });
}
