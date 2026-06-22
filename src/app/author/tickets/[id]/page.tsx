"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { useSSE } from "@/hooks/useSSE";
import { format } from "date-fns";
import {
    ChevronLeft,
    MessageCircle,
    User,
    BookOpen,
    Clock,
    Tag,
    AlertCircle,
} from "lucide-react";

interface Response {
    id: string;
    message: string;
    sentBy: string;
    senderName: string;
    createdAt: string;
}

interface TicketDetail {
    id: string;
    ticketNumber: string;
    subject: string;
    description: string;
    status: string;
    category: string | null;
    priority: string | null;
    createdAt: string;
    updatedAt: string;
    book: { title: string; bookCode: string } | null;
    responses: Response[];
}

export default function AuthorTicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [ticket, setTicket] = useState<TicketDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);

    const fetchTicket = useCallback(async () => {
        const res = await fetch(`/api/tickets/${id}`);
        if (res.ok) {
            const data = await res.json();
            setTicket(data.ticket);
        }
        setLoading(false);
    }, [id]);

    useEffect(() => { fetchTicket(); }, [fetchTicket]);

    // Scroll to bottom when responses update
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [ticket?.responses.length]);

    // Real-time updates
    useSSE((event) => {
        if (
            (event.type === "new_response" || event.type === "ticket_updated") &&
            event.ticketId === id
        ) {
            fetchTicket();
        }
    });

    if (loading) {
        return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
    }

    if (!ticket) {
        return (
            <div className="text-center py-20">
                <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
                <p className="text-slate-600">Ticket not found.</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-2xl">
            <button
                onClick={() => router.back()}
                className="btn btn-ghost mb-5 text-sm -ml-2"
            >
                <ChevronLeft className="w-4 h-4" />
                Back to Tickets
            </button>

            {/* Ticket header */}
            <div className="card p-6 mb-5">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">{ticket.subject}</h1>
                        <p className="text-sm text-slate-400 mt-1">{ticket.ticketNumber}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {ticket.priority && (
                            <Badge variant={ticket.priority.toLowerCase()}>{ticket.priority}</Badge>
                        )}
                        <Badge variant={ticket.status.toLowerCase().replace(" ", "-")}>{ticket.status}</Badge>
                    </div>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-pink-300" />
                        Submitted {format(new Date(ticket.createdAt), "dd MMM yyyy, h:mm a")}
                    </span>
                    {ticket.book && (
                        <span className="flex items-center gap-1.5">
                            <BookOpen className="w-3 h-3 text-pink-300" />
                            {ticket.book.title}
                        </span>
                    )}
                    {ticket.category && (
                        <span className="flex items-center gap-1.5">
                            <Tag className="w-3 h-3 text-pink-300" />
                            {ticket.category}
                        </span>
                    )}
                </div>

                <hr className="border-pink-100 my-4" />

                {/* Original description */}
                <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Your Query</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
                </div>
            </div>

            {/* Conversation thread */}
            <div className="card p-6">
                <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-pink-400" />
                    Conversation
                    {ticket.responses.length > 0 && (
                        <span className="badge badge-open text-xs">{ticket.responses.length}</span>
                    )}
                </h2>

                {ticket.responses.length === 0 ? (
                    <div className="text-center py-8">
                        <MessageCircle className="w-8 h-8 text-pink-200 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">No responses yet.</p>
                        <p className="text-xs text-slate-400 mt-1">Our support team will respond within 24–48 hours.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {ticket.responses.map((r) => {
                            const isAdmin = r.sentBy === "admin";
                            return (
                                <div
                                    key={r.id}
                                    className={`animate-slide-in flex gap-3 ${isAdmin ? "" : "flex-row-reverse"}`}
                                >
                                    {/* Avatar */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isAdmin
                                            ? "bg-gradient-to-br from-pink-400 to-pink-600"
                                            : "bg-gradient-to-br from-slate-400 to-slate-600"
                                        }`}>
                                        <User className="w-4 h-4 text-white" />
                                    </div>

                                    {/* Bubble */}
                                    <div className={`max-w-[80%] ${isAdmin ? "items-start" : "items-end"} flex flex-col`}>
                                        <p className="text-xs text-slate-400 mb-1">
                                            {r.senderName} · {format(new Date(r.createdAt), "dd MMM, h:mm a")}
                                        </p>
                                        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${isAdmin
                                                ? "bg-gradient-to-br from-pink-50 to-rose-50 text-slate-700 border border-pink-100"
                                                : "bg-slate-100 text-slate-700"
                                            }`}>
                                            {r.message}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Status info box */}
            {(ticket.status === "Open" || ticket.status === "In Progress") && (
                <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-600 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    This ticket is {ticket.status.toLowerCase()}. You'll be notified in real time when a response arrives.
                </div>
            )}
        </div>
    );
}
