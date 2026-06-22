"use client";
import { useState, useEffect } from "react";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { Users, BookOpen, IndianRupee, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Book {
    id: string;
    title: string;
    status: string;
    totalCopiesSold: number;
    royaltyPending: number;
}

interface Author {
    id: string;
    authorCode: string;
    name: string;
    city: string | null;
    joinedDate: string;
    user: { email: string };
    books: Book[];
}

export default function AdminAuthorsPage() {
    const [authors, setAuthors] = useState<Author[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Author | null>(null);

    useEffect(() => {
        fetch("/api/admin/authors")
            .then((r) => r.json())
            .then((d) => { setAuthors(d.authors ?? []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
    }

    return (
        <div className="animate-fade-in space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Authors</h1>
                <p className="text-slate-500 mt-1">{authors.length} registered authors</p>
            </div>

            {authors.length === 0 ? (
                <EmptyState icon={Users} title="No authors found" />
            ) : (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Author</th>
                                <th>Email</th>
                                <th>City</th>
                                <th>Joined</th>
                                <th>Books</th>
                                <th>Pending Royalty</th>
                            </tr>
                        </thead>
                        <tbody>
                            {authors.map((author) => {
                                const totalPending = author.books.reduce((s, b) => s + b.royaltyPending, 0);
                                return (
                                    <tr
                                        key={author.id}
                                        className="cursor-pointer"
                                        onClick={() => setSelected(author)}
                                    >
                                        <td>
                                            <div>
                                                <p className="font-medium text-slate-800">{author.name}</p>
                                                <p className="text-xs text-slate-400">{author.authorCode}</p>
                                            </div>
                                        </td>
                                        <td className="text-slate-500">{author.user.email}</td>
                                        <td className="text-slate-500">{author.city ?? "—"}</td>
                                        <td className="text-slate-500">{format(new Date(author.joinedDate), "dd MMM yyyy")}</td>
                                        <td>
                                            <span className="badge badge-open">{author.books.length}</span>
                                        </td>
                                        <td>
                                            <span className={`font-semibold ${totalPending > 0 ? "text-orange-600" : "text-green-600"}`}>
                                                ₹{totalPending.toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Author detail modal */}
            {selected && (
                <div
                    className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
                >
                    <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in p-6">
                        <div className="flex items-start justify-between mb-5">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{selected.name}</h2>
                                <p className="text-sm text-slate-400">{selected.authorCode}</p>
                            </div>
                            <button onClick={() => setSelected(null)} className="btn btn-ghost text-slate-400 p-1.5">✕</button>
                        </div>

                        <div className="space-y-3 mb-5 text-sm">
                            {[
                                { icon: Users, label: "Email", value: selected.user.email },
                                { icon: MapPin, label: "City", value: selected.city ?? "—" },
                                { icon: Calendar, label: "Joined", value: format(new Date(selected.joinedDate), "dd MMM yyyy") },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="flex items-center gap-3">
                                    <Icon className="w-4 h-4 text-pink-300" />
                                    <span className="text-slate-500">{label}:</span>
                                    <span className="font-medium text-slate-700">{value}</span>
                                </div>
                            ))}
                        </div>

                        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-pink-400" />
                            Books ({selected.books.length})
                        </h3>
                        <div className="space-y-2">
                            {selected.books.map((book) => (
                                <div key={book.id} className="p-3 rounded-xl bg-pink-50 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">{book.title}</p>
                                        <p className="text-xs text-slate-400">{book.totalCopiesSold} copies sold</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">Pending</p>
                                        <p className={`text-sm font-semibold ${book.royaltyPending > 0 ? "text-orange-600" : "text-green-600"}`}>
                                            ₹{book.royaltyPending.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-pink-50 to-rose-50 flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                                <IndianRupee className="w-4 h-4 text-pink-400" />
                                Total Pending Royalty
                            </span>
                            <span className="text-base font-bold text-orange-600">
                                ₹{selected.books.reduce((s, b) => s + b.royaltyPending, 0).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
