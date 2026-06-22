"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { Ticket, Plus, MessageCircle, Clock, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useSSE } from "@/hooks/useSSE";
import { useToast } from "@/components/ui/Toast";

interface TicketItem {
    id: string;
    ticketNumber: string;
    subject: string;
    status: string;
    category: string | null;
    priority: string | null;
    createdAt: string;
    updatedAt: string;
    responses: { id: string }[];
    book: { title: string } | null;
}

export default function AuthorTicketsPage() {
    const [tickets, setTickets] = useState<TicketItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const { toast } = useToast();

    const fetchTickets = useCallback(async () => {
        const url = statusFilter === "all" ? "/api/tickets" : `/api/tickets?status=${statusFilter}`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            setTickets(data.tickets);
        }
        setLoading(false);
    }, [statusFilter]);

    useEffect(() => { fetchTickets(); }, [fetchTickets]);

    // Real-time updates via SSE
    useSSE((event) => {
        if (event.type === "new_response" || event.type === "ticket_updated") {
            fetchTickets();
            toast("A ticket was just updated by the support team.", "info");
        }
    });

    const filtered = statusFilter === "all"
        ? tickets
        : tickets.filter((t) => t.status.toLowerCase() === statusFilter.toLowerCase());

    const statuses = ["all", "Open", "In Progress", "Resolved", "Closed"];

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">My Tickets</h1>
                    <p className="text-slate-500 mt-1">{tickets.length} support quer{tickets.length !== 1 ? "ies" : "y"} submitted</p>
                </div>
                <Link href="/author/tickets/new" className="btn btn-primary">
                    <Plus className="w-4 h-4" />
                    New Query
                </Link>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {statuses.map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`btn text-xs py-1.5 px-3 ${statusFilter === s ? "btn-primary" : "btn-secondary"}`}
                    >
                        {s === "all" ? "All" : s}
                    </button>
                ))}
                <button onClick={fetchTickets} className="btn btn-ghost ml-auto text-xs" aria-label="Refresh tickets">
                    <RefreshCw className="w-3 h-3" />
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={Ticket}
                    title="No tickets found"
                    description="Submit a query and we'll get back to you shortly."
                    action={
                        <Link href="/author/tickets/new" className="btn btn-primary">
                            Submit a Query
                        </Link>
                    }
                />
            ) : (
                <div className="space-y-3">
                    {filtered.map((ticket) => (
                        <Link
                            key={ticket.id}
                            href={`/author/tickets/${ticket.id}`}
                            className="card p-5 card-hover flex items-start gap-4 group block"
                        >
                            <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center shrink-0 group-hover:bg-pink-100 transition-colors">
                                <MessageCircle className="w-5 h-5 text-pink-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                    <div>
                                        <p className="font-semibold text-slate-800 group-hover:text-pink-600 transition-colors">
                                            {ticket.subject}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                                            <span className="text-xs text-slate-400">{ticket.ticketNumber}</span>
                                            {ticket.book && (
                                                <span className="text-xs text-slate-400">• {ticket.book.title}</span>
                                            )}
                                            {ticket.category && (
                                                <span className="text-xs text-pink-400">{ticket.category}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {ticket.priority && (
                                            <Badge variant={ticket.priority.toLowerCase()}>{ticket.priority}</Badge>
                                        )}
                                        <Badge variant={ticket.status.toLowerCase().replace(" ", "-")}>{ticket.status}</Badge>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {format(new Date(ticket.createdAt), "dd MMM yyyy")}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MessageCircle className="w-3 h-3" />
                                        {ticket.responses.length} response{ticket.responses.length !== 1 ? "s" : ""}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
