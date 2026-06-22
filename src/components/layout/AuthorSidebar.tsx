"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
    BookOpen,
    LayoutDashboard,
    MessageSquarePlus,
    Ticket,
    LogOut,
    Leaf,
    User,
} from "lucide-react";

const navItems = [
    { href: "/author/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/author/books", label: "My Books", icon: BookOpen },
    { href: "/author/tickets", label: "My Tickets", icon: Ticket },
    { href: "/author/tickets/new", label: "Submit Query", icon: MessageSquarePlus },
];

export default function AuthorSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    return (
        <aside className="sidebar w-64 shrink-0 flex flex-col h-screen sticky top-0">
            {/* Brand */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-pink-100">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center shadow">
                    <Leaf className="w-5 h-5 text-white" />
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-800">BookLeaf</p>
                    <p className="text-xs text-pink-500">Author Portal</p>
                </div>
            </div>

            {/* User card */}
            <div className="mx-4 mt-4 p-3 rounded-xl bg-pink-50 border border-pink-100">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-300 to-pink-500 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                            {user?.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 py-4 space-y-1" aria-label="Author navigation">
                {navItems.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || pathname.startsWith(href + "/");
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`sidebar-link ${active ? "active" : ""}`}
                            aria-current={active ? "page" : undefined}
                        >
                            <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="px-4 pb-6">
                <button
                    onClick={handleLogout}
                    className="sidebar-link w-full text-left hover:text-red-500 hover:bg-red-50"
                    aria-label="Log out"
                >
                    <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
                    Log Out
                </button>
            </div>
        </aside>
    );
}
