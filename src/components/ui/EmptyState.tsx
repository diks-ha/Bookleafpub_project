import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center mb-4 border border-pink-100">
                <Icon className="w-7 h-7 text-pink-300" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-slate-500 max-w-xs">{description}</p>
            )}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
