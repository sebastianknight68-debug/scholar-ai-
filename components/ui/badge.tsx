import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-cardElevated px-2.5 py-0.5 text-xs font-medium text-white/90",
        className,
      )}
      {...props}
    />
  );
}
