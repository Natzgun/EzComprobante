import * as React from "react";

export function Separator({ className = "", ...props }: React.HTMLAttributes<HTMLHRElement>) {
  return <hr className={`border-zinc-200 dark:border-zinc-800 ${className}`} {...props} />;
}
