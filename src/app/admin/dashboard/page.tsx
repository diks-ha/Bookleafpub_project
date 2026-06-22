"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Spinner from "@/components/ui/Spinner";
import { Ticket, Users, BookOpen, AlertTriangle, ChevronRight, TrendingUp } from "lucide-react";

interface Stats {
    totalTickets: number;
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    criticalTickets: number;
    totalAuthors: number;
    totalBooks: number;
    categoryBreakdown: { category: string; count: number }[];
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/stats")
            .then((r) => r.json())
            .then((d) => { setStats(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
    }

    if (!stats) return null;

    const statCards = [
        { label: "Total Tickets", value: stats.totalTickets, icon: Ticket, color: "pink", link: "/admin/tickets" },
        { label: "Open Tickets", value: stats.openTickets, icon: AlertTriangle, color: "orange", link: "/admin/tickets?status=Open" },
        { label: "Total Authors", value: stats.totalAuthors, icon: Users, color: "purple", link: "/admin/authors" },
        { label: "Total Books", value: stats.totalBooks, icon: BookOpen, color: "green", link: "#" },
    ];

    return (
        <div className="animate-fade-in space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
                <p className="text-slate-500 mt-1">BookLeaf support operations overview</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(({ label, value, icon: Icon, link }) => (
                    <Link key={label} href={link} className="card p-5 card-hover block">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
                            <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center">
                                <Icon className="w-4 h-4 text-pink-500" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-slate-800">{value}</p>
                    </Link>
                ))}
            </div>

            {/* Critical alert */}
            {stats.criticalTickets > 0 && (
                <div className="card p-4 bg-gradient-to-r from-red-50 to-pink-50 border-red-200 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center animate-pulse-soft shrink-0">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-red-700">{stats.criticalTickets} Critical Ticket{stats.criticalTickets !== 1 ? "s" : ""} Require Attention</p>
                            <p className="text-xs text-red-500">These tickets need immediate response.</p>
                        </div>
                    </div>
                    <Link href="/admin/tickets?priority=Critical" className="btn btn-danger shrink-0">
                        View Now <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Status breakdown */}
                <div className="card p-6">
                    <h2 className="font-semibold text-slate-800 mb-4">Ticket Status Breakdown</h2>
                    <div className="space-y-3">
                        {[
                            { label: "Open", value: stats.openTickets, total: stats.totalTickets, color: "#f48fb1" },
                            { label: "In Progress", value: stats.inProgressTickets, total: stats.totalTickets, color: "#ffb74d" },
                            { label: "Resolved", value: stats.resolvedTickets, total: stats.totalTickets, color: "#81c784" },
                            { label: "Closed", value: stats.totalTickets - stats.openTickets - stats.inProgressTickets - stats.resolvedTickets, total: stats.totalTickets, color: "#90a4ae" },
                        ].map(({ label, value, total, color }) => (
                            <div key={label}>
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-slate-600">{label}</span>
                                    <span className="font-semibold text-slate-700">{value}</span>
                                </div>
                                <div className="h-2 rounded-full bg-pink-50 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: total > 0 ? `${(value / total) * 100}%` : "0%", backgroundColor: color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Category breakdown */}
                <div className="card p-6">
                    <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-pink-400" />
                        Tickets by Category
                    </h2>
                    {stats.categoryBreakdown.length === 0 ? (
                        <p className="text-sm text-slate-400 py-4 text-center">No categorised tickets yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {stats.categoryBreakdown
                                .sort((a, b) => b.count - a.count)
                                .map(({ category, count }) => (
                                    <div key={category} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-pink-50 transition-colors">
                                        <span className="text-sm text-slate-600 truncate mr-3">{category}</span>
                                        <span className="badge badge-open shrink-0">{count}</span>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick actions */}
            <div className="card p-6">
                <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                    <Link href="/admin/tickets?status=Open" className="btn btn-primary">
                        View Open Tickets
                    </Link>
                    <Link href="/admin/tickets?priority=Critical" className="btn btn-secondary">
                        Critical Queue
                    </Link>
                    <Link href="/admin/authors" className="btn btn-secondary">
                        Browse Authors
                    </Link>
                </div>
            </div>
        </div>
    );
}
