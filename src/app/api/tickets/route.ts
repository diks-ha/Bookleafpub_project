/**
 * GET  /api/tickets  — list tickets (author: own; admin: all)
 * POST /api/tickets  — create a new ticket (author only)
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { classifyAndPrioritise } from "@/lib/openai";

// ── GET /api/tickets ───────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);
    const skip = (page - 1) * limit;

    if (auth.user.role === "author") {
        // Author: fetch their author record, then their tickets
        const author = await prisma.author.findUnique({
            where: { userId: auth.user.userId },
        });
        if (!author) {
            return NextResponse.json({ error: "Author not found" }, { status: 404 });
        }

        const [tickets, total] = await Promise.all([
            prisma.ticket.findMany({
                where: { authorId: author.id, ...(status ? { status } : {}) },
                include: {
                    book: { select: { title: true, bookCode: true } },
                    responses: { orderBy: { createdAt: "asc" } },
                },
                orderBy: { updatedAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.ticket.count({ where: { authorId: author.id } }),
        ]);

        return NextResponse.json({ tickets, total, page, limit });
    }

    // Admin: all tickets with optional filters
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;

    const [tickets, total] = await Promise.all([
        prisma.ticket.findMany({
            where,
            include: {
                author: { select: { name: true, authorCode: true } },
                book: { select: { title: true, bookCode: true } },
                responses: { orderBy: { createdAt: "asc" } },
                assignedTo: { select: { email: true } },
            },
            orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
            skip,
            take: limit,
        }),
        prisma.ticket.count({ where }),
    ]);

    return NextResponse.json({ tickets, total, page, limit });
}

// ── POST /api/tickets ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    if (auth.user.role !== "author") {
        return NextResponse.json(
            { error: "Only authors can create tickets" },
            { status: 403 }
        );
    }

    const body = await req.json();
    const { subject, description, bookId } = body;

    if (!subject?.trim() || !description?.trim()) {
        return NextResponse.json(
            { error: "Subject and description are required" },
            { status: 400 }
        );
    }

    const author = await prisma.author.findUnique({
        where: { userId: auth.user.userId },
    });
    if (!author) {
        return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    // If bookId provided, verify it belongs to this author
    if (bookId) {
        const book = await prisma.book.findFirst({
            where: { id: bookId, authorId: author.id },
        });
        if (!book) {
            return NextResponse.json(
                { error: "Book not found or not owned by you" },
                { status: 404 }
            );
        }
    }

    // Generate collision-safe ticket number using DB count + timestamp suffix
    const count = await prisma.ticket.count();
    const ticketNumber = `TKT-${String(count + 1).padStart(4, "0")}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

    // Create ticket first so the author gets immediate feedback
    const ticket = await prisma.ticket.create({
        data: {
            ticketNumber,
            subject: subject.trim(),
            description: description.trim(),
            authorId: author.id,
            bookId: bookId || null,
            status: "Open",
        },
        include: {
            book: { select: { title: true, bookCode: true } },
        },
    });

    // AI classification runs async — don't block the response
    // We update the ticket after classification completes
    classifyAndPrioritise(subject, description)
        .then(async (result) => {
            await prisma.ticket.update({
                where: { id: ticket.id },
                data: {
                    category: result.category,
                    priority: result.priority,
                    aiCategory: result.category,
                    aiPriority: result.priority,
                },
            });
        })
        .catch((err) => {
            // AI is down — ticket is still created, classification defaults to null
            console.error("[AI Classification failed]", err);
        });

    return NextResponse.json({ ticket }, { status: 201 });
}
