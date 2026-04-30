import * as React from "react";

export function Card({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-3xl border border-zinc-200 bg-white/90 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex flex-col gap-2 p-6 ${className}`} {...props} />;
}

export function CardTitle({ className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={`text-xl font-semibold tracking-tight ${className}`} {...props} />;
}

export function CardDescription({ className = "", ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-sm text-zinc-600 dark:text-zinc-400 ${className}`} {...props} />;
}

export function CardContent({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-6 pt-0 ${className}`} {...props} />;
}
