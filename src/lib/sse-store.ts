/**
 * In-process SSE event store.
 * Maps authorId → set of SSE response writers.
 * When an admin responds to a ticket, we emit an event to all connected
 * clients subscribed to that author's tickets.
 *
 * Note: This is suitable for a single-instance deployment (Vercel serverless
 * won't work here — for multi-instance, replace with Redis pub/sub).
 */

type Writer = (data: string) => void;

class SSEStore {
    private listeners = new Map<string, Set<Writer>>();

    subscribe(authorId: string, writer: Writer): () => void {
        if (!this.listeners.has(authorId)) {
            this.listeners.set(authorId, new Set());
        }
        this.listeners.get(authorId)!.add(writer);

        // Return unsubscribe function
        return () => {
            this.listeners.get(authorId)?.delete(writer);
            if (this.listeners.get(authorId)?.size === 0) {
                this.listeners.delete(authorId);
            }
        };
    }

    emit(authorId: string, event: object): void {
        const writers = this.listeners.get(authorId);
        if (!writers?.size) return;
        const payload = `data: ${JSON.stringify(event)}\n\n`;
        writers.forEach((write) => {
            try {
                write(payload);
            } catch {
                // Client disconnected — cleanup happens via unsubscribe
            }
        });
    }
}

// Singleton across hot-reloads in development
const globalForSSE = globalThis as unknown as { sseStore: SSEStore };
export const sseStore = globalForSSE.sseStore ?? new SSEStore();
if (process.env.NODE_ENV !== "production") {
    globalForSSE.sseStore = sseStore;
}
