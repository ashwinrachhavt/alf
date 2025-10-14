import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-[color:var(--color-background)] px-3 py-2 text-sm text-[color:var(--color-foreground)] placeholder:text-[color:var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        aria-label={props["aria-label"] ?? "Start Research"}
        role={props.role ?? "searchbox"}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
