"use client";
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import Spinner from "@/components/ui/Spinner";
import { Send, Paperclip, ChevronLeft, Info } from "lucide-react";

interface Book {
    id: string;
    title: string;
    status: string;
}

export default function NewTicketPage() {
    const [books, setBooks] = useState<Book[]>([]);
    const [bookId, setBookId] = useState("");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        fetch("/api/author/books")
            .then((r) => r.json())
            .then((d) => setBooks(d.books ?? []));
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !description.trim()) {
            toast("Subject and description are required.", "error");
            return;
        }
        setSubmitting(true);
        const res = await fetch("/api/tickets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subject, description, bookId: bookId || null }),
        });
        const data = await res.json();
        setSubmitting(false);
        if (!res.ok) {
            toast(data.error ?? "Failed to submit ticket.", "error");
            return;
        }
        toast("Your query has been submitted! We'll get back to you shortly.", "success");
        router.push("/author/tickets");
    };

    return (
        <div className="animate-fade-in max-w-2xl">
            <button
                onClick={() => router.back()}
                className="btn btn-ghost mb-5 text-sm -ml-2"
            >
                <ChevronLeft className="w-4 h-4" />
                Back to Tickets
            </button>

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Submit a Support Query</h1>
                <p className="text-slate-500 mt-1">
                    Describe your issue and our team will respond as soon as possible.
                </p>
            </div>

            <div className="card p-6">
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    {/* Book select */}
                    <div>
                        <label htmlFor="book" className="block text-sm font-medium text-slate-700 mb-1.5">
                            Related Book <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <select
                            id="book"
                            value={bookId}
                            onChange={(e) => setBookId(e.target.value)}
                            className="input select"
                        >
                            <option value="">General / Account Level</option>
                            {books.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Subject */}
                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1.5">
                            Subject <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="subject"
                            type="text"
                            required
                            maxLength={200}
                            className="input"
                            placeholder="e.g. Royalty payment not received for Q3"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                        <p className="text-xs text-slate-400 mt-1">{subject.length}/200 characters</p>
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
                            Detailed Description <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            id="description"
                            required
                            rows={6}
                            className="input"
                            placeholder="Please describe your issue in detail. Include relevant dates, amounts, or ISBNs to help us resolve it faster."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    {/* File attachment (UI only) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Attachments <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <div className="border-2 border-dashed border-pink-200 rounded-xl p-6 text-center hover:border-pink-400 transition-colors cursor-pointer">
                            <Paperclip className="w-5 h-5 text-pink-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">Drag & drop files here, or click to browse</p>
                            <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG up to 10MB</p>
                        </div>
                    </div>

                    {/* AI classification notice */}
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
                        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-600">
                            Your query will be automatically categorised and prioritised by our AI system so the right team member can help you faster.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn btn-primary"
                        >
                            {submitting ? <Spinner size="sm" /> : <Send className="w-4 h-4" />}
                            {submitting ? "Submitting…" : "Submit Query"}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
