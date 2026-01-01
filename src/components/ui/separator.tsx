<<<<<<< Updated upstream
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
=======
import type { ComponentPropsWithoutRef } from "react";
import { Root } from "@radix-ui/react-separator";
import { cn } from "../../lib/utils";

const Separator = ({ className, orientation = "horizontal", decorative = true, ...props }: ComponentPropsWithoutRef<typeof Root>) => (
  <Root
    decorative={decorative}
    orientation={orientation}
>>>>>>> Stashed changes
    className={cn(
      "shrink-0 bg-border",
      orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
      className
    )}
<<<<<<< Updated upstream
    decorative={decorative}
    orientation={orientation}
=======
>>>>>>> Stashed changes
    {...props}
  />
);
Separator.displayName = Root.displayName;

export { Separator };
