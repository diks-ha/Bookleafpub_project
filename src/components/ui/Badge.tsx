/**
 * Reusable status and priority badge component
 */

interface BadgeProps {
    variant:
    | "open"
    | "in-progress"
    | "resolved"
    | "closed"
    | "critical"
    | "high"
    | "medium"
    | "low"
    | "live"
    | "production"
    | string;
    children: React.ReactNode;
    className?: string;
}

const variantMap: Record<string, string> = {
    open: "badge-open",
    "in-progress": "badge-in-progress",
    "in progress": "badge-in-progress",
    resolved: "badge-resolved",
    closed: "badge-closed",
    critical: "badge-critical",
    high: "badge-high",
    medium: "badge-medium",
    low: "badge-low",
    live: "badge-resolved",
    production: "badge-in-progress",
};

export default function Badge({ variant, children, className = "" }: BadgeProps) {
    const cls = variantMap[variant.toLowerCase()] ?? "badge-closed";
    return (
        <span className={`badge ${cls} ${className}`}>
            {children}
        </span>
    );
}
