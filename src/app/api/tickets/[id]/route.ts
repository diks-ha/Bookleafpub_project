/**
 * GET    /api/tickets/[id]  — get single ticket with responses + notes
 * PATCH  /api/tickets/[id]  — update ticket (admin: status/category/priority/assignedTo; author: —)
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { generateDraftResponse } from "@/lib/openai";
import { sseStore } from "@/lib/sse-store";

// ── GET /api/tickets/[id] ─────────────────────────────────────────────────

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
            author: { select: { name: true, authorCode: true, userId: true } },
            book: true,
            responses: { orderBy: { createdAt: "asc" } },
            internalNotes: {
                orderBy: { createdAt: "asc" },
                include: { admin: { select: { email: true } } },
            },
            assignedTo: { select: { id: true, email: true } },
        },
    });

    if (!ticket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Authors can only see their own tickets
    if (auth.user.role === "author") {
        const author = await prisma.author.findUnique({
            where: { userId: auth.user.userId },
        });
        if (!author || ticket.authorId !== author.id) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
        // Strip internal notes for authors
        const { internalNotes: _notes, ...safeTicket } = ticket;
        return NextResponse.json({ ticket: safeTicket });
    }

    // Admin: generate AI draft if not already cached
    if (!ticket.aiDraft) {
        const book = ticket.book;
        generateDraftResponse({
            subject: ticket.subject,
            description: ticket.description,
            category: ticket.category ?? "General Inquiry",
            priority: ticket.priority ?? "Medium",
            authorName: ticket.author.name,
            bookTitle: book?.title,
            bookStatus: book?.status,
            royaltyPending: book?.royaltyPending,
            royaltyPaid: book?.royaltyPaid,
        })
            .then(async (draft) => {
                await prisma.ticket.update({
                    where: { id: ticket.id },
                    data: { aiDraft: draft },
                });
            })
            .catch((err) => {
                console.error("[AI Draft generation failed]", err);
            });
    }

    return NextResponse.json({ ticket });
}

// ── PATCH /api/tickets/[id] ───────────────────────────────────────────────

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    if (auth.user.role !== "admin") {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, category, priority, assignedToId } = body;

    const allowed = ["Open", "In Progress", "Resolved", "Closed"];
    if (status && !allowed.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Resolve "me" keyword to the actual admin's userId
    const resolvedAssignedToId =
        assignedToId === "me" ? auth.user.userId : assignedToId;

    const ticket = await prisma.ticket.update({
        where: { id },
        data: {
            ...(status !== undefined && { status }),
            ...(category !== undefined && { category }),
            ...(priority !== undefined && { priority }),
            ...(resolvedAssignedToId !== undefined && { assignedToId: resolvedAssignedToId }),
        },
        include: {
            author: { select: { name: true } },
            book: { select: { title: true } },
        },
    });

    // Notify author via SSE
    sseStore.emit(ticket.authorId, { type: "ticket_updated", ticketId: id, status: ticket.status });

    return NextResponse.json({ ticket });
}
