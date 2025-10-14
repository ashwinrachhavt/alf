import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100",
        success:
          "border-transparent bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400",
        error:
          "border-transparent bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400",
        warning:
          "border-transparent bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400",
        outline: "text-neutral-900 dark:text-neutral-100 border-neutral-200 dark:border-neutral-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
