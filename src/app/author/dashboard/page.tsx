"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import Spinner from "@/components/ui/Spinner";
import Badge from "@/components/ui/Badge";
import {
    BookOpen,
    IndianRupee,
    Ticket,
    TrendingUp,
    ChevronRight,
    AlertCircle,
    Clock,
} from "lucide-react";

interface Book {
    id: string;
    title: string;
    status: string;
    totalCopiesSold: number;
    royaltyPending: number;
    royaltyPaid: number;
    totalRoyaltyEarned: number;
}

interface TicketSummary {
    id: string;
    ticketNumber: string;
    subject: string;
    status: string;
    priority: string | null;
    createdAt: string;
}

export default function AuthorDashboard() {
    const { user } = useAuth();
    const [books, setBooks] = useState<Book[]>([]);
    const [tickets, setTickets] = useState<TicketSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const [booksRes, ticketsRes] = await Promise.all([
                fetch("/api/author/books"),
                fetch("/api/tickets?limit=5"),
            ]);
            if (booksRes.ok) setBooks((await booksRes.json()).books);
            if (ticketsRes.ok) setTickets((await ticketsRes.json()).tickets);
            setLoading(false);
        };
        load();
    }, []);

    const totalEarned = books.reduce((s, b) => s + b.totalRoyaltyEarned, 0);
    const totalPending = books.reduce((s, b) => s + b.royaltyPending, 0);
    const totalSold = books.reduce((s, b) => s + b.totalCopiesSold, 0);
    const openTickets = tickets.filter((t) => t.status === "Open" || t.status === "In Progress").length;

    const stats = [
        { label: "My Books", value: books.length, icon: BookOpen, color: "pink" },
        { label: "Copies Sold", value: totalSold.toLocaleString(), icon: TrendingUp, color: "purple" },
        { label: "Total Earned", value: `₹${totalEarned.toLocaleString()}`, icon: IndianRupee, color: "green" },
        { label: "Royalty Pending", value: `₹${totalPending.toLocaleString()}`, icon: AlertCircle, color: "orange" },
    ];

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">
                    Welcome back, {user?.name?.split(" ")[0]} 👋
                </h1>
                <p className="text-slate-500 mt-1">
                    Here's a snapshot of your publishing activity.
                </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="card p-5 card-hover">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
                            <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center">
                                <Icon className="w-4 h-4 text-pink-500" aria-hidden="true" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{value}</p>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent books */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-slate-800">My Books</h2>
                        <Link href="/author/books" className="text-sm text-pink-500 hover:text-pink-600 flex items-center gap-1">
                            View all <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                    {books.length === 0 ? (
                        <p className="text-sm text-slate-400 py-4 text-center">No books found.</p>
                    ) : (
                        <div className="space-y-3">
                            {books.slice(0, 4).map((book) => (
                                <div key={book.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-pink-50 transition-colors">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-700 truncate">{book.title}</p>
                                        <p className="text-xs text-slate-400">{book.totalCopiesSold} copies sold</p>
                                    </div>
                                    <Badge variant={book.status.includes("Published") ? "live" : "production"}>
                                        {book.status.includes("Published") ? "Live" : "In Prod"}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent tickets */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-slate-800">Recent Tickets</h2>
                        <Link href="/author/tickets" className="text-sm text-pink-500 hover:text-pink-600 flex items-center gap-1">
                            View all <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                    {tickets.length === 0 ? (
                        <div className="text-center py-6">
                            <Ticket className="w-8 h-8 text-pink-200 mx-auto mb-2" />
                            <p className="text-sm text-slate-400">No tickets yet.</p>
                            <Link href="/author/tickets/new" className="btn btn-primary mt-3 text-xs">
                                Submit a Query
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tickets.slice(0, 4).map((ticket) => (
                                <Link
                                    key={ticket.id}
                                    href={`/author/tickets/${ticket.id}`}
                                    className="flex items-center justify-between p-3 rounded-xl hover:bg-pink-50 transition-colors group"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-700 truncate group-hover:text-pink-600">
                                            {ticket.subject}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <Clock className="w-3 h-3 text-slate-300" />
                                            <span className="text-xs text-slate-400">{ticket.ticketNumber}</span>
                                        </div>
                                    </div>
                                    <Badge variant={ticket.status.toLowerCase().replace(" ", "-")}>
                                        {ticket.status}
                                    </Badge>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Pending royalty banner */}
            {totalPending >= 1000 && (
                <div className="card p-4 bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center shrink-0">
                            <IndianRupee className="w-5 h-5 text-pink-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">
                                ₹{totalPending.toLocaleString()} in pending royalties
                            </p>
                            <p className="text-xs text-slate-500">
                                Royalties are paid quarterly within 45 days of quarter end.
                            </p>
                        </div>
                    </div>
                    <Link href="/author/books" className="btn btn-primary text-xs shrink-0">
                        View Details
                    </Link>
                </div>
            )}
        </div>
    );
}
