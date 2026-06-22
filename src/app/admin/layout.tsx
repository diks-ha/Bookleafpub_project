"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AdminSidebar from "@/components/layout/AdminSidebar";
import Spinner from "@/components/ui/Spinner";
import { Leaf } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) router.replace("/login");
        if (!loading && user && user.role !== "admin") router.replace("/author/dashboard");
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-pink-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center">
                        <Leaf className="w-6 h-6 text-white" />
                    </div>
                    <Spinner size="lg" />
                </div>
            </div>
        );
    }

    if (!user || user.role !== "admin") return null;

    return (
        <div className="flex min-h-screen bg-pink-50">
            <AdminSidebar />
            <main className="flex-1 overflow-auto">
                <div className="max-w-6xl mx-auto p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
