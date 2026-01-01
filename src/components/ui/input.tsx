import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";

const Input = ({ className, type, ...props }: ComponentProps<"input">) => (
  <input
    className={cn(
      "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 font-medium text-foreground text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    type={type}
    {...props}
  />
);
Input.displayName = "Input";

export { Input };
