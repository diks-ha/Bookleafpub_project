"use client";
/**
 * useSSE — subscribes to the /api/sse endpoint and calls onEvent
 * whenever the server pushes an update.
 *
 * Automatically reconnects on disconnect (exponential backoff, max 30s).
 * Only active on the client; no-ops on the server.
 */
import { useEffect, useRef } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SSEEvent = Record<string, any>;

export function useSSE(onEvent: (event: SSEEvent) => void) {
    const onEventRef = useRef(onEvent);
    onEventRef.current = onEvent; // keep latest closure without re-subscribing

    useEffect(() => {
        if (typeof window === "undefined") return;

        let es: EventSource | null = null;
        let retryDelay = 1000;
        let destroyed = false;

        function connect() {
            if (destroyed) return;
            es = new EventSource("/api/sse");

            es.onmessage = (ev) => {
                try {
                    const data = JSON.parse(ev.data);
                    if (data.type !== "connected") {
                        onEventRef.current(data);
                    }
                } catch {
                    // ignore malformed
                }
            };

            es.onopen = () => {
                retryDelay = 1000; // reset backoff on successful connect
            };

            es.onerror = () => {
                es?.close();
                if (!destroyed) {
                    // Exponential backoff — max 30s
                    setTimeout(() => {
                        retryDelay = Math.min(retryDelay * 1.5, 30000);
                        connect();
                    }, retryDelay);
                }
            };
        }

        connect();

        return () => {
            destroyed = true;
            es?.close();
        };
    }, []); // empty deps — subscribe once
}
