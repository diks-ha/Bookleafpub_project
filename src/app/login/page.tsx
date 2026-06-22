"use client";
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Spinner from "@/components/ui/Spinner";
import { Leaf, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginPage() {
    const { login, user, loading } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Redirect already-authenticated users — must be in useEffect, not render
    useEffect(() => {
        if (!loading && user) {
            router.replace(user.role === "admin" ? "/admin/dashboard" : "/author/dashboard");
        }
    }, [user, loading, router]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        const result = await login(email.trim(), password);
        setSubmitting(false);
        if (result.error) {
            setError(result.error);
            return;
        }
        // Auth context updated — the useEffect above will handle redirect
    };

    const fillDemo = (role: "author" | "admin") => {
        if (role === "admin") {
            setEmail("admin@bookleaf.com");
            setPassword("adminpass123");
        } else {
            setEmail("priya.sharma@email.com");
            setPassword("password123");
        }
    };

    // Show spinner while loading or while redirecting an already-logged-in user
    if (loading || (!loading && user)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-pink-50">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <main className="min-h-screen flex">
            {/* Left panel — decorative */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-pink-400 via-pink-500 to-pink-600 relative overflow-hidden">
                {/* Background circles */}
                <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10" />
                <div className="absolute bottom-12 right-0 w-64 h-64 rounded-full bg-white/10" />
                <div className="absolute top-1/3 right-8 w-32 h-32 rounded-full bg-white/10" />

                <div className="relative">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <Leaf className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white font-bold text-xl">BookLeaf Publishing</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white leading-tight mb-4">
                        Author Support &<br />Communication Portal
                    </h1>
                    <p className="text-pink-100 text-lg leading-relaxed max-w-sm">
                        Manage your books, track royalties, and get fast, AI-powered support from the BookLeaf team.
                    </p>
                </div>

                <div className="relative grid grid-cols-2 gap-4">
                    {[
                        { label: "Authors", value: "10,000+" },
                        { label: "Books Published", value: "22,000+" },
                        { label: "Monthly Titles", value: "1,200+" },
                        { label: "Avg Response Time", value: "< 24h" },
                    ].map(({ label, value }) => (
                        <div key={label} className="p-4 rounded-xl bg-white/15 backdrop-blur-sm">
                            <p className="text-2xl font-bold text-white">{value}</p>
                            <p className="text-pink-100 text-sm">{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-pink-50">
                <div className="w-full max-w-md animate-fade-in">
                    {/* Mobile brand */}
                    <div className="flex items-center gap-3 mb-8 lg:hidden">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center">
                            <Leaf className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-slate-800">BookLeaf Publishing</span>
                    </div>

                    <div className="card p-8">
                        <h2 className="text-2xl font-bold text-slate-800 mb-1">Welcome back</h2>
                        <p className="text-sm text-slate-500 mb-6">Sign in to your account to continue.</p>

                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 mb-5 text-sm text-red-600">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} noValidate>
                            <div className="mb-4">
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="input"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="mb-6">
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPass ? "text" : "password"}
                                        autoComplete="current-password"
                                        required
                                        className="input pr-11"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-pink-500 transition-colors"
                                        aria-label={showPass ? "Hide password" : "Show password"}
                                    >
                                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="btn btn-primary w-full justify-center py-3 text-base"
                            >
                                {submitting ? <Spinner size="sm" /> : null}
                                {submitting ? "Signing in…" : "Sign In"}
                            </button>
                        </form>

                        {/* Demo credentials */}
                        <div className="mt-6 pt-5 border-t border-pink-100">
                            <p className="text-xs text-slate-500 mb-3 text-center font-medium uppercase tracking-wide">
                                Demo Credentials
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => fillDemo("author")}
                                    className="btn btn-secondary text-xs py-2 justify-center"
                                >
                                    Author Login
                                </button>
                                <button
                                    type="button"
                                    onClick={() => fillDemo("admin")}
                                    className="btn btn-secondary text-xs py-2 justify-center"
                                >
                                    Admin Login
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 text-center mt-2">
                                Click a button above, then press Sign In
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
