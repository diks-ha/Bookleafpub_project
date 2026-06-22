/**
 * GET /api/admin/stats
 * Returns dashboard summary stats for the admin.
 * Admin only.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const auth = requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const [
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        criticalTickets,
        totalAuthors,
        totalBooks,
    ] = await Promise.all([
        prisma.ticket.count(),
        prisma.ticket.count({ where: { status: "Open" } }),
        prisma.ticket.count({ where: { status: "In Progress" } }),
        prisma.ticket.count({ where: { status: "Resolved" } }),
        prisma.ticket.count({ where: { priority: "Critical" } }),
        prisma.author.count(),
        prisma.book.count(),
    ]);

    // Category breakdown
    const categoryBreakdown = await prisma.ticket.groupBy({
        by: ["category"],
        _count: { category: true },
        where: { category: { not: null } },
    });

    return NextResponse.json({
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        criticalTickets,
        totalAuthors,
        totalBooks,
        categoryBreakdown: categoryBreakdown.map((c) => ({
            category: c.category,
            count: c._count.category,
        })),
    });
}
