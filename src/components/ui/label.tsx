import { Root } from "@radix-ui/react-label";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../../lib/utils";

const Label = ({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Root>) => (
  <Root
    className={cn(
      "font-medium text-foreground text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
);
Label.displayName = Root.displayName;

export { Label };
