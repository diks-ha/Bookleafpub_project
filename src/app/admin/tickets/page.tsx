"use client";
import { Suspense } from "react";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { Ticket, Clock, User, Filter, ChevronRight, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface TicketItem {
    id: string;
    ticketNumber: string;
    subject: string;
    status: string;
    category: string | null;
    priority: string | null;
    createdAt: string;
    updatedAt: string;
    author: { name: string; authorCode: string };
    book: { title: string } | null;
    responses: { id: string }[];
    assignedTo: { email: string } | null;
}

const STATUSES = ["", "Open", "In Progress", "Resolved", "Closed"];
const CATEGORIES = [
    "",
    "Royalty & Payments",
    "ISBN & Metadata Issues",
    "Printing & Quality",
    "Distribution & Availability",
    "Book Status & Production Updates",
    "General Inquiry",
];
const PRIORITIES = ["", "Critical", "High", "Medium", "Low"];

const priorityOrder: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export default function AdminTicketsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Spinner size="lg" /></div>}>
            <AdminTicketsContent />
        </Suspense>
    );
}

function AdminTicketsContent() {
    const searchParams = useSearchParams();
    const [tickets, setTickets] = useState<TicketItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    const [status, setStatus] = useState(searchParams.get("status") ?? "");
    const [category, setCategory] = useState(searchParams.get("category") ?? "");
    const [priority, setPriority] = useState(searchParams.get("priority") ?? "");
    const [page, setPage] = useState(1);

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (status) params.set("status", status);
        if (category) params.set("category", category);
        if (priority) params.set("priority", priority);
        params.set("page", String(page));
        params.set("limit", "15");

        const res = await fetch(`/api/tickets?${params}`);
        if (res.ok) {
            const data = await res.json();
            setTickets(data.tickets);
            setTotal(data.total);
        }
        setLoading(false);
    }, [status, category, priority, page]);

    useEffect(() => { fetchTickets(); }, [fetchTickets]);

    const sorted = [...tickets].sort((a, b) => {
        const pa = priorityOrder[a.priority ?? "Low"] ?? 3;
        const pb = priorityOrder[b.priority ?? "Low"] ?? 3;
        if (pa !== pb) return pa - pb;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Ticket Queue</h1>
                    <p className="text-slate-500 mt-1">{total} ticket{total !== 1 ? "s" : ""} total</p>
                </div>
                <button onClick={fetchTickets} className="btn btn-secondary text-sm" aria-label="Refresh">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-pink-400" />
                    <span className="text-sm font-medium text-slate-700">Filters</span>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Status</label>
                        <select
                            value={status}
                            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                            className="input select text-sm py-2"
                        >
                            <option value="">All Statuses</option>
                            {STATUSES.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Category</label>
                        <select
                            value={category}
                            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                            className="input select text-sm py-2"
                        >
                            <option value="">All Categories</option>
                            {CATEGORIES.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Priority</label>
                        <select
                            value={priority}
                            onChange={(e) => { setPriority(e.target.value); setPage(1); }}
                            className="input select text-sm py-2"
                        >
                            <option value="">All Priorities</option>
                            {PRIORITIES.filter(Boolean).map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
                {(status || category || priority) && (
                    <button
                        onClick={() => { setStatus(""); setCategory(""); setPriority(""); setPage(1); }}
                        className="btn btn-ghost text-xs mt-2"
                    >
                        Clear filters
                    </button>
                )}
            </div>

            {/* Tickets list */}
            {loading ? (
                <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : sorted.length === 0 ? (
                <EmptyState icon={Ticket} title="No tickets found" description="Try adjusting your filters." />
            ) : (
                <div className="space-y-2">
                    {sorted.map((ticket) => {
                        const isCritical = ticket.priority === "Critical";
                        return (
                            <Link
                                key={ticket.id}
                                href={`/admin/tickets/${ticket.id}`}
                                className={`card p-4 card-hover flex items-start gap-4 group block ${isCritical ? "border-red-200 bg-red-50/30" : ""}`}
                            >
                                {/* Priority indicator */}
                                <div className={`w-1 self-stretch rounded-full shrink-0 ${ticket.priority === "Critical" ? "bg-red-400" :
                                    ticket.priority === "High" ? "bg-orange-400" :
                                        ticket.priority === "Medium" ? "bg-blue-400" : "bg-green-400"
                                    }`} />

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-800 group-hover:text-pink-600 transition-colors truncate">
                                                {ticket.subject}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                                                <span className="flex items-center gap-1"><User className="w-3 h-3" />{ticket.author.name}</span>
                                                <span>{ticket.ticketNumber}</span>
                                                {ticket.book && <span>· {ticket.book.title}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                            {ticket.priority && <Badge variant={ticket.priority.toLowerCase()}>{ticket.priority}</Badge>}
                                            <Badge variant={ticket.status.toLowerCase().replace(" ", "-")}>{ticket.status}</Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-5 mt-2 text-xs text-slate-400 flex-wrap">
                                        {ticket.category && <span className="text-pink-400">{ticket.category}</span>}
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(ticket.createdAt), "dd MMM yyyy")}</span>
                                        <span>{ticket.responses.length} response{ticket.responses.length !== 1 ? "s" : ""}</span>
                                        {ticket.assignedTo && <span>Assigned to: {ticket.assignedTo.email}</span>}
                                    </div>
                                </div>

                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-pink-400 transition-colors shrink-0 mt-1" />
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {total > 15 && (
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="btn btn-secondary text-sm"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-slate-500">Page {page} of {Math.ceil(total / 15)}</span>
                    <button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= Math.ceil(total / 15)}
                        className="btn btn-secondary text-sm"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
// Note: The AdminTicketsContent function above is wrapped by AdminTicketsPage with Suspense
