/**
 * GET /api/tickets/[id]/ai-draft
 * Returns (or generates) an AI draft response for a ticket.
 * Admin only. Cached on the ticket — won't call OpenAI twice for same ticket.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { generateDraftResponse } from "@/lib/openai";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
            author: { select: { name: true } },
            book: true,
        },
    });

    if (!ticket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Return cached draft if available
    if (ticket.aiDraft) {
        return NextResponse.json({ draft: ticket.aiDraft, cached: true });
    }

    // Generate fresh draft
    try {
        const draft = await generateDraftResponse({
            subject: ticket.subject,
            description: ticket.description,
            category: ticket.category ?? "General Inquiry",
            priority: ticket.priority ?? "Medium",
            authorName: ticket.author.name,
            bookTitle: ticket.book?.title,
            bookStatus: ticket.book?.status,
            royaltyPending: ticket.book?.royaltyPending,
            royaltyPaid: ticket.book?.royaltyPaid,
        });

        // Cache on the ticket
        await prisma.ticket.update({
            where: { id },
            data: { aiDraft: draft },
        });

        return NextResponse.json({ draft, cached: false });
    } catch (err) {
        console.error("[AI Draft]", err);
        // Graceful degradation — admin can still write manually
        return NextResponse.json(
            {
                draft: null,
                error:
                    "AI service is currently unavailable. Please write a response manually.",
            },
            { status: 503 }
        );
    }
}
