/**
 * POST /api/tickets/[id]/respond
 * Admin sends a response to the author.
 * The response becomes visible on the author's ticket view.
 * Triggers an SSE event to the author in real time.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { sseStore } from "@/lib/sse-store";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const body = await req.json();
    const { message } = body;

    if (!message?.trim()) {
        return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Create the response record
    const response = await prisma.ticketResponse.create({
        data: {
            ticketId: id,
            message: message.trim(),
            sentBy: "admin",
            senderName: "BookLeaf Support Team",
        },
    });

    // Auto-update ticket status to "In Progress" if it was "Open"
    if (ticket.status === "Open") {
        await prisma.ticket.update({
            where: { id },
            data: { status: "In Progress" },
        });
    }

    // Push real-time SSE event to the author
    sseStore.emit(ticket.authorId, {
        type: "new_response",
        ticketId: id,
        response: {
            id: response.id,
            message: response.message,
            sentBy: response.sentBy,
            senderName: response.senderName,
            createdAt: response.createdAt,
        },
    });

    return NextResponse.json({ response }, { status: 201 });
}
