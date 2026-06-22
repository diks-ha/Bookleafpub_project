"use client";
/**
 * Simple toast notification context + hook
 */
import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextValue {
    toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons = {
    success: <CheckCircle className="w-4 h-4 text-green-600" />,
    error: <XCircle className="w-4 h-4 text-red-500" />,
    info: <AlertCircle className="w-4 h-4 text-blue-500" />,
};

const styles = {
    success: "border-green-200 bg-green-50",
    error: "border-red-200 bg-red-50",
    info: "border-blue-200 bg-blue-50",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback((message: string, type: ToastType = "info") => {
        const id = Math.random().toString(36).slice(2);
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const remove = (id: string) =>
        setToasts((prev) => prev.filter((t) => t.id !== id));

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {/* Toast container */}
            <div
                aria-live="polite"
                className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full"
            >
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`animate-fade-in flex items-start gap-3 p-3 rounded-xl border shadow-lg ${styles[t.type]}`}
                    >
                        <span className="mt-0.5 shrink-0">{icons[t.type]}</span>
                        <p className="text-sm text-slate-700 flex-1">{t.message}</p>
                        <button
                            onClick={() => remove(t.id)}
                            className="shrink-0 text-slate-400 hover:text-slate-600"
                            aria-label="Dismiss"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be inside ToastProvider");
    return ctx;
}
