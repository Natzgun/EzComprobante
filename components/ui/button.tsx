import * as React from "react";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "default" | "sm" | "lg";
}

const variants: Record<ButtonVariant, string> = {
  default:
    "bg-zinc-950 text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200",
  secondary:
    "bg-zinc-100 text-zinc-950 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700",
  outline:
    "border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900",
  ghost:
    "text-zinc-950 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800",
};

const sizes = {
  default: "h-10 px-4 py-2",
  sm: "h-9 px-3 text-sm",
  lg: "h-11 px-6",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        suppressHydrationWarning
        className={`inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-zinc-200 ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
