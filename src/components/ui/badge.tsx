<<<<<<< HEAD
<<<<<<< Updated upstream
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-semibold text-xs uppercase tracking-[0.2em]",
=======
=======
>>>>>>> 6d5602a (Save)
import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
<<<<<<< HEAD
>>>>>>> Stashed changes
=======
>>>>>>> 6d5602a (Save)
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border bg-background text-foreground",
<<<<<<< HEAD
<<<<<<< Updated upstream
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
=======
        destructive: "border-transparent bg-destructive text-destructive-foreground",
>>>>>>> Stashed changes
=======
        destructive: "border-transparent bg-destructive text-destructive-foreground",
>>>>>>> 6d5602a (Save)
        success:
          "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = ({ className, variant, ...props }: BadgeProps) => (
  <div className={cn(badgeVariants({ variant }), className)} {...props} />
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
