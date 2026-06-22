interface SpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
}

const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };
const borders = { sm: "border-2", md: "border-2", lg: "border-4" };

export default function Spinner({ size = "md", className = "" }: SpinnerProps) {
    return (
        <span
            role="status"
            aria-label="Loading"
            className={`inline-block ${sizes[size]} ${borders[size]} border-pink-200 border-t-pink-500 rounded-full animate-spin ${className}`}
        />
    );
}
