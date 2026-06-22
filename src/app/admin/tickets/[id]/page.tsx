"use client";
import { useState, useEffect, useCallback, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { format } from "date-fns";
import {
    ChevronLeft,
    Bot,
    Send,
    StickyNote,
    Save,
    User,
    BookOpen,
    Tag,
    Clock,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Edit3,
} from "lucide-react";

interface Response {
    id: string;
    message: string;
    sentBy: string;
    senderName: string;
    createdAt: string;
}

interface InternalNote {
    id: string;
    note: string;
    createdAt: string;
    admin: { email: string };
}

interface TicketDetail {
    id: string;
    ticketNumber: string;
    subject: string;
    description: string;
    status: string;
    category: string | null;
    priority: string | null;
    aiCategory: string | null;
    aiPriority: string | null;
    aiDraft: string | null;
    createdAt: string;
    updatedAt: string;
    author: { name: string; authorCode: string };
    book: { title: string; bookCode: string; mrp: number | null; status: string; royaltyPending: number; royaltyPaid: number } | null;
    responses: Response[];
    internalNotes: InternalNote[];
    assignedTo: { id: string; email: string } | null;
}

const STATUSES = ["Open", "In Progress", "Resolved", "Closed"];
const CATEGORIES = [
    "Royalty & Payments",
    "ISBN & Metadata Issues",
    "Printing & Quality",
    "Distribution & Availability",
    "Book Status & Production Updates",
    "General Inquiry",
];
const PRIORITIES = ["Critical", "High", "Medium", "Low"];

export default function AdminTicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const { toast } = useToast();

    const [ticket, setTicket] = useState<TicketDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [aiDraft, setAiDraft] = useState("");
    const [draftLoading, setDraftLoading] = useState(false);
    const [draftError, setDraftError] = useState("");
    const [replyMessage, setReplyMessage] = useState("");
    const [replySending, setReplySending] = useState(false);
    const [noteText, setNoteText] = useState("");
    const [noteSaving, setNoteSaving] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"conversation" | "notes">("conversation");

    // Editable metadata
    const [editStatus, setEditStatus] = useState("");
    const [editCategory, setEditCategory] = useState("");
    const [editPriority, setEditPriority] = useState("");

    const fetchTicket = useCallback(async () => {
        const res = await fetch(`/api/tickets/${id}`);
        if (res.ok) {
            const data = await res.json();
            const t = data.ticket as TicketDetail;
            setTicket(t);
            setEditStatus(t.status);
            setEditCategory(t.category ?? "");
            setEditPriority(t.priority ?? "");
            if (t.aiDraft && !aiDraft) setAiDraft(t.aiDraft);
        }
        setLoading(false);
    }, [id, aiDraft]);

    useEffect(() => { fetchTicket(); }, [fetchTicket]);

    const loadAIDraft = async () => {
        setDraftLoading(true);
        setDraftError("");
        const res = await fetch(`/api/tickets/${id}/ai-draft`);
        const data = await res.json();
        setDraftLoading(false);
        if (!res.ok || data.error) {
            setDraftError(data.error ?? "AI service unavailable. Please write a response manually.");
            return;
        }
        setAiDraft(data.draft);
        setReplyMessage(data.draft);
        toast("AI draft loaded — review and edit before sending.", "info");
    };

    const sendReply = async (e: FormEvent) => {
        e.preventDefault();
        if (!replyMessage.trim()) return;
        setReplySending(true);
        const res = await fetch(`/api/tickets/${id}/respond`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: replyMessage }),
        });
        setReplySending(false);
        if (!res.ok) {
            toast("Failed to send response.", "error");
            return;
        }
        toast("Response sent to author!", "success");
        setReplyMessage("");
        fetchTicket();
    };

    const saveNote = async (e: FormEvent) => {
        e.preventDefault();
        if (!noteText.trim()) return;
        setNoteSaving(true);
        const res = await fetch(`/api/tickets/${id}/notes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ note: noteText }),
        });
        setNoteSaving(false);
        if (!res.ok) {
            toast("Failed to save note.", "error");
            return;
        }
        toast("Internal note saved.", "success");
        setNoteText("");
        fetchTicket();
    };

    const saveMetadata = async () => {
        setSaving(true);
        const res = await fetch(`/api/tickets/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                status: editStatus,
                category: editCategory || null,
                priority: editPriority || null,
            }),
        });
        setSaving(false);
        if (!res.ok) {
            toast("Failed to update ticket.", "error");
            return;
        }
        toast("Ticket updated.", "success");
        fetchTicket();
    };

    const assignToMe = async () => {
        const res = await fetch(`/api/tickets/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assignedToId: "me" }), // backend resolves from token
        });
        // Simplified — just refresh
        if (res.ok) { toast("Ticket assigned to you.", "success"); fetchTicket(); }
    };

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

    const metadataChanged = editStatus !== ticket.status || editCategory !== (ticket.category ?? "") || editPriority !== (ticket.priority ?? "");

    return (
        <div className="animate-fade-in">
            <button onClick={() => router.back()} className="btn btn-ghost mb-5 text-sm -ml-2">
                <ChevronLeft className="w-4 h-4" />Back to Queue
            </button>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Ticket header */}
                    <div className="card p-6">
                        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs text-slate-400">{ticket.ticketNumber}</span>
                                    {ticket.priority === "Critical" && (
                                        <span className="badge badge-critical animate-pulse-soft">🔴 Critical</span>
                                    )}
                                </div>
                                <h1 className="text-xl font-bold text-slate-800">{ticket.subject}</h1>
                            </div>
                            <div className="flex items-center gap-2">
                                {ticket.priority && <Badge variant={ticket.priority.toLowerCase()}>{ticket.priority}</Badge>}
                                <Badge variant={ticket.status.toLowerCase().replace(" ", "-")}>{ticket.status}</Badge>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500 mb-4">
                            <span className="flex items-center gap-1.5"><User className="w-3 h-3 text-pink-300" />{ticket.author.name}</span>
                            {ticket.book && <span className="flex items-center gap-1.5"><BookOpen className="w-3 h-3 text-pink-300" />{ticket.book.title}</span>}
                            {ticket.category && <span className="flex items-center gap-1.5"><Tag className="w-3 h-3 text-pink-300" />{ticket.category}</span>}
                            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-pink-300" />{format(new Date(ticket.createdAt), "dd MMM yyyy, h:mm a")}</span>
                        </div>
                        <div className="p-4 rounded-xl bg-pink-50/60 border border-pink-100">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Author's Query</p>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 p-1 bg-pink-50 rounded-xl w-fit">
                        {(["conversation", "notes"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab
                                        ? "bg-white text-pink-600 shadow-sm"
                                        : "text-slate-500 hover:text-pink-500"
                                    }`}
                            >
                                {tab === "conversation" ? "Conversation" : "Internal Notes"}
                                {tab === "conversation" && ticket.responses.length > 0 && (
                                    <span className="ml-1.5 badge badge-open text-xs">{ticket.responses.length}</span>
                                )}
                                {tab === "notes" && ticket.internalNotes.length > 0 && (
                                    <span className="ml-1.5 badge badge-medium text-xs">{ticket.internalNotes.length}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Conversation tab */}
                    {activeTab === "conversation" && (
                        <div className="card p-6 space-y-5">
                            {/* Existing responses */}
                            {ticket.responses.length > 0 && (
                                <div className="space-y-4 mb-2">
                                    {ticket.responses.map((r) => (
                                        <div key={r.id} className={`flex gap-3 ${r.sentBy === "admin" ? "" : "flex-row-reverse"}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${r.sentBy === "admin"
                                                    ? "bg-gradient-to-br from-pink-400 to-pink-600"
                                                    : "bg-gradient-to-br from-slate-400 to-slate-600"
                                                }`}>
                                                <User className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="max-w-[80%]">
                                                <p className="text-xs text-slate-400 mb-1">{r.senderName} · {format(new Date(r.createdAt), "dd MMM, h:mm a")}</p>
                                                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${r.sentBy === "admin"
                                                        ? "bg-gradient-to-br from-pink-50 to-rose-50 text-slate-700 border border-pink-100"
                                                        : "bg-slate-100 text-slate-700"
                                                    }`}>
                                                    {r.message}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* AI draft area */}
                            <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-100">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Bot className="w-4 h-4 text-violet-500" />
                                        <span className="text-sm font-medium text-violet-700">AI Draft Response</span>
                                        {aiDraft && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                                    </div>
                                    <button
                                        onClick={loadAIDraft}
                                        disabled={draftLoading}
                                        className="btn btn-ghost text-xs text-violet-600 hover:bg-violet-50 py-1 px-2"
                                    >
                                        {draftLoading ? <Spinner size="sm" /> : <RefreshCw className="w-3 h-3" />}
                                        {aiDraft ? "Regenerate" : "Generate Draft"}
                                    </button>
                                </div>
                                {draftError && (
                                    <p className="text-xs text-red-500 mb-2">{draftError}</p>
                                )}
                                {aiDraft && (
                                    <div className="text-xs text-slate-600 bg-white/60 rounded-lg p-3 mb-2 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                        {aiDraft}
                                    </div>
                                )}
                                {aiDraft && (
                                    <button
                                        onClick={() => setReplyMessage(aiDraft)}
                                        className="btn btn-ghost text-xs text-violet-600 hover:bg-violet-100 py-1 px-2"
                                    >
                                        <Edit3 className="w-3 h-3" />
                                        Use as Reply
                                    </button>
                                )}
                            </div>

                            {/* Reply form */}
                            <form onSubmit={sendReply}>
                                <label htmlFor="reply" className="block text-sm font-medium text-slate-700 mb-2">
                                    Reply to Author
                                </label>
                                <textarea
                                    id="reply"
                                    rows={5}
                                    className="input mb-3"
                                    placeholder="Write your response here…"
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={replySending || !replyMessage.trim()}
                                    className="btn btn-primary"
                                >
                                    {replySending ? <Spinner size="sm" /> : <Send className="w-4 h-4" />}
                                    Send Response
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Notes tab */}
                    {activeTab === "notes" && (
                        <div className="card p-6 space-y-4">
                            {ticket.internalNotes.length === 0 ? (
                                <p className="text-sm text-slate-400 py-4 text-center">No internal notes yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {ticket.internalNotes.map((note) => (
                                        <div key={note.id} className="p-3 rounded-xl bg-yellow-50 border border-yellow-100">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-yellow-700">{note.admin.email}</span>
                                                <span className="text-xs text-slate-400">{format(new Date(note.createdAt), "dd MMM, h:mm a")}</span>
                                            </div>
                                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.note}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <form onSubmit={saveNote}>
                                <label htmlFor="note" className="block text-sm font-medium text-slate-700 mb-2">
                                    Add Internal Note <span className="text-slate-400 font-normal text-xs">(not visible to author)</span>
                                </label>
                                <textarea
                                    id="note"
                                    rows={3}
                                    className="input mb-3"
                                    placeholder="e.g. Escalated to accounts team on 22 Jun…"
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                />
                                <button type="submit" disabled={noteSaving || !noteText.trim()} className="btn btn-secondary">
                                    {noteSaving ? <Spinner size="sm" /> : <StickyNote className="w-4 h-4" />}
                                    Save Note
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Sidebar — metadata */}
                <div className="space-y-5">
                    {/* Ticket details */}
                    <div className="card p-5">
                        <h3 className="font-semibold text-slate-700 mb-4">Ticket Details</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Status</label>
                                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="input select text-sm py-2">
                                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">
                                    Category
                                    {ticket.aiCategory && ticket.aiCategory !== editCategory && (
                                        <span className="ml-1 text-violet-400">(AI: {ticket.aiCategory})</span>
                                    )}
                                </label>
                                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="input select text-sm py-2">
                                    <option value="">Uncategorised</option>
                                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">
                                    Priority
                                    {ticket.aiPriority && ticket.aiPriority !== editPriority && (
                                        <span className="ml-1 text-violet-400">(AI: {ticket.aiPriority})</span>
                                    )}
                                </label>
                                <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)} className="input select text-sm py-2">
                                    <option value="">Unset</option>
                                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>

                            {metadataChanged && (
                                <button onClick={saveMetadata} disabled={saving} className="btn btn-primary w-full justify-center text-sm">
                                    {saving ? <Spinner size="sm" /> : <Save className="w-3.5 h-3.5" />}
                                    Save Changes
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Author info */}
                    <div className="card p-5">
                        <h3 className="font-semibold text-slate-700 mb-3">Author</h3>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-300 to-pink-500 flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-800">{ticket.author.name}</p>
                                <p className="text-xs text-slate-400">{ticket.author.authorCode}</p>
                            </div>
                        </div>
                    </div>

                    {/* Book info */}
                    {ticket.book && (
                        <div className="card p-5">
                            <h3 className="font-semibold text-slate-700 mb-3">Book</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Title</span>
                                    <span className="font-medium text-slate-700 text-right max-w-[60%] truncate">{ticket.book.title}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Status</span>
                                    <Badge variant={ticket.book.status.includes("Published") ? "live" : "production"}>
                                        {ticket.book.status.includes("Published") ? "Live" : "In Prod"}
                                    </Badge>
                                </div>
                                {ticket.book.mrp && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">MRP</span>
                                        <span className="font-medium text-slate-700">₹{ticket.book.mrp}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Royalty Pending</span>
                                    <span className="font-semibold text-orange-600">₹{ticket.book.royaltyPending.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Royalty Paid</span>
                                    <span className="font-semibold text-green-600">₹{ticket.book.royaltyPaid.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Assignment */}
                    <div className="card p-5">
                        <h3 className="font-semibold text-slate-700 mb-3">Assignment</h3>
                        {ticket.assignedTo ? (
                            <p className="text-sm text-slate-600">Assigned to: <span className="font-medium">{ticket.assignedTo.email}</span></p>
                        ) : (
                            <p className="text-sm text-slate-400 mb-3">Unassigned</p>
                        )}
                        <button onClick={assignToMe} className="btn btn-secondary w-full justify-center text-sm">
                            <User className="w-3.5 h-3.5" />
                            Assign to Me
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
