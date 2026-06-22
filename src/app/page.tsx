"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Spinner from "@/components/ui/Spinner";
import { Leaf } from "lucide-react";

/**
 * Root page: redirects to the correct portal based on auth state.
 */
export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (user.role === "admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/author/dashboard");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-pink-50">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center shadow-lg">
        <Leaf className="w-7 h-7 text-white" />
      </div>
      <Spinner size="lg" />
      <p className="text-sm text-slate-500">Loading BookLeaf Portal…</p>
    </div>
  );
}
