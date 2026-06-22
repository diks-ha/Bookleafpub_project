/**
 * GET  /api/tickets/[id]/notes  — get internal notes (admin only)
 * POST /api/tickets/[id]/notes  — add internal note (admin only)
 * Internal notes are NOT visible to authors.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;

    const notes = await prisma.internalNote.findMany({
        where: { ticketId: id },
        orderBy: { createdAt: "asc" },
        include: { admin: { select: { email: true } } },
    });

    return NextResponse.json({ notes });
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const body = await req.json();
    const { note } = body;

    if (!note?.trim()) {
        return NextResponse.json({ error: "Note content is required" }, { status: 400 });
    }

    const created = await prisma.internalNote.create({
        data: {
            ticketId: id,
            note: note.trim(),
            adminId: auth.user.userId,
        },
        include: { admin: { select: { email: true } } },
    });

    return NextResponse.json({ note: created }, { status: 201 });
}
