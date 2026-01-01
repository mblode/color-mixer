import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";

const Input = ({ className, type, ...props }: ComponentProps<"input">) => (
  <input
<<<<<<< HEAD
<<<<<<< Updated upstream
    className={cn(
      "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 font-medium text-foreground text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    type={type}
=======
=======
>>>>>>> 6d5602a (Save)
    type={type}
    className={cn(
      "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
<<<<<<< HEAD
>>>>>>> Stashed changes
=======
>>>>>>> 6d5602a (Save)
    {...props}
  />
);
Input.displayName = "Input";

export { Input };
