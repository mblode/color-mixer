import { Root } from "@radix-ui/react-separator";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../../lib/utils";

const Separator = ({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: ComponentPropsWithoutRef<typeof Root>) => (
  <Root
    className={cn(
      "shrink-0 bg-border",
      orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
      className
    )}
    decorative={decorative}
    orientation={orientation}
    {...props}
  />
);
Separator.displayName = Root.displayName;

export { Separator };
