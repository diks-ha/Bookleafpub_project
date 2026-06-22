/**
 * GET /api/sse
 * Server-Sent Events endpoint for real-time ticket updates.
 * Authors subscribe to events for their own tickets.
 * The stream stays open; the server pushes events when admin responds.
 */
import { NextRequest } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sseStore } from "@/lib/sse-store";

export const runtime = "nodejs"; // SSE requires Node.js runtime (not Edge)
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    // Authenticate the request
    const token = getTokenFromRequest(req);
    if (!token) {
        return new Response("Unauthorized", { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== "author") {
        return new Response("Author access only", { status: 403 });
    }

    // Get the authorId for this user
    const author = await prisma.author.findUnique({
        where: { userId: user.userId },
        select: { id: true },
    });

    if (!author) {
        return new Response("Author not found", { status: 404 });
    }

    const authorId = author.id;

    // Set up the SSE stream
    const encoder = new TextEncoder();
    let unsubscribe: (() => void) | null = null;
    let controller: ReadableStreamDefaultController<Uint8Array> | null = null;

    const stream = new ReadableStream<Uint8Array>({
        start(ctrl) {
            controller = ctrl;

            // Send initial heartbeat
            const heartbeat = `data: ${JSON.stringify({ type: "connected" })}\n\n`;
            ctrl.enqueue(encoder.encode(heartbeat));

            // Subscribe to events for this author
            unsubscribe = sseStore.subscribe(authorId, (data: string) => {
                try {
                    ctrl.enqueue(encoder.encode(data));
                } catch {
                    // Stream closed
                }
            });

            // Heartbeat every 25s to keep connection alive
            const interval = setInterval(() => {
                try {
                    ctrl.enqueue(encoder.encode(": heartbeat\n\n"));
                } catch {
                    clearInterval(interval);
                }
            }, 25000);

            // Clean up on close
            req.signal.addEventListener("abort", () => {
                clearInterval(interval);
                unsubscribe?.();
                try {
                    ctrl.close();
                } catch {
                    // already closed
                }
            });
        },
        cancel() {
            unsubscribe?.();
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no", // Disable Nginx buffering
        },
    });
}
