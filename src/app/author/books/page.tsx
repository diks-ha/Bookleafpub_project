"use client";
import { useState, useEffect } from "react";
import Spinner from "@/components/ui/Spinner";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import {
    BookOpen,
    IndianRupee,
    TrendingUp,
    ShoppingBag,
    Calendar,
    Hash,
    ExternalLink,
} from "lucide-react";
import { format } from "date-fns";

interface Book {
    id: string;
    bookCode: string;
    title: string;
    isbn: string;
    genre: string;
    publicationDate: string | null;
    status: string;
    mrp: number | null;
    authorRoyaltyPerCopy: number | null;
    totalCopiesSold: number;
    totalRoyaltyEarned: number;
    royaltyPaid: number;
    royaltyPending: number;
    lastRoyaltyPayoutDate: string | null;
    printPartner: string | null;
    availableOn: string[];
}

export default function AuthorBooksPage() {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Book | null>(null);

    useEffect(() => {
        fetch("/api/author/books")
            .then((r) => r.json())
            .then((d) => { setBooks(d.books ?? []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
    }

    return (
        <div className="animate-fade-in space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">My Books</h1>
                <p className="text-slate-500 mt-1">{books.length} book{books.length !== 1 ? "s" : ""} in your catalog</p>
            </div>

            {books.length === 0 ? (
                <EmptyState icon={BookOpen} title="No books yet" description="Your published and in-production books will appear here." />
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {books.map((book) => (
                        <button
                            key={book.id}
                            onClick={() => setSelected(book)}
                            className="card p-5 card-hover text-left w-full focus:ring-2 focus:ring-pink-400 focus:outline-none"
                            aria-label={`View details for ${book.title}`}
                        >
                            {/* Book header */}
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-800 leading-snug">{book.title}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{book.genre}</p>
                                </div>
                                <Badge variant={book.status.toLowerCase().includes("published") ? "live" : "production"}>
                                    {book.status.includes("Published") ? "Live" : "In Prod"}
                                </Badge>
                            </div>

                            <div className="divider !my-3" />

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-2.5 rounded-xl bg-pink-50">
                                    <p className="text-xs text-slate-500 mb-0.5">Copies Sold</p>
                                    <p className="text-base font-bold text-slate-800">{book.totalCopiesSold.toLocaleString()}</p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-pink-50">
                                    <p className="text-xs text-slate-500 mb-0.5">MRP</p>
                                    <p className="text-base font-bold text-slate-800">
                                        {book.mrp ? `₹${book.mrp}` : "—"}
                                    </p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-green-50">
                                    <p className="text-xs text-slate-500 mb-0.5">Royalty Paid</p>
                                    <p className="text-base font-bold text-green-700">₹{book.royaltyPaid.toLocaleString()}</p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-orange-50">
                                    <p className="text-xs text-slate-500 mb-0.5">Pending</p>
                                    <p className="text-base font-bold text-orange-600">₹{book.royaltyPending.toLocaleString()}</p>
                                </div>
                            </div>

                            <p className="text-xs text-pink-400 mt-3 text-center">Click to view full details →</p>
                        </button>
                    ))}
                </div>
            )}

            {/* Book detail modal */}
            {selected && (
                <div
                    className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Details for ${selected.title}`}
                    onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
                >
                    <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in p-6">
                        <div className="flex items-start justify-between mb-5">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{selected.title}</h2>
                                <p className="text-sm text-slate-500">{selected.genre}</p>
                            </div>
                            <button
                                onClick={() => setSelected(null)}
                                className="btn btn-ghost text-slate-400 p-1.5"
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Status */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-pink-50">
                                <span className="text-sm text-slate-600">Status</span>
                                <Badge variant={selected.status.toLowerCase().includes("published") ? "live" : "production"}>
                                    {selected.status}
                                </Badge>
                            </div>

                            {/* Details grid */}
                            {[
                                { icon: Hash, label: "ISBN", value: selected.isbn },
                                { icon: Calendar, label: "Publication Date", value: selected.publicationDate ? format(new Date(selected.publicationDate), "dd MMM yyyy") : "In Production" },
                                { icon: IndianRupee, label: "MRP", value: selected.mrp ? `₹${selected.mrp}` : "—" },
                                { icon: IndianRupee, label: "Royalty Per Copy", value: selected.authorRoyaltyPerCopy ? `₹${selected.authorRoyaltyPerCopy}` : "—" },
                                { icon: TrendingUp, label: "Total Copies Sold", value: selected.totalCopiesSold.toLocaleString() },
                                { icon: IndianRupee, label: "Total Royalty Earned", value: `₹${selected.totalRoyaltyEarned.toLocaleString()}` },
                                { icon: IndianRupee, label: "Royalty Paid", value: `₹${selected.royaltyPaid.toLocaleString()}` },
                                { icon: IndianRupee, label: "Royalty Pending", value: `₹${selected.royaltyPending.toLocaleString()}` },
                                { icon: Calendar, label: "Last Payout Date", value: selected.lastRoyaltyPayoutDate ? format(new Date(selected.lastRoyaltyPayoutDate), "dd MMM yyyy") : "N/A" },
                                { icon: ShoppingBag, label: "Print Partner", value: selected.printPartner ?? "—" },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="flex items-center justify-between py-2 border-b border-pink-50">
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Icon className="w-4 h-4 text-pink-300" />
                                        {label}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">{value}</span>
                                </div>
                            ))}

                            {/* Available on */}
                            {selected.availableOn.length > 0 && (
                                <div>
                                    <p className="text-sm text-slate-500 mb-2 flex items-center gap-2">
                                        <ExternalLink className="w-4 h-4 text-pink-300" />
                                        Available On
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {selected.availableOn.map((platform) => (
                                            <span key={platform} className="badge badge-medium">{platform}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
