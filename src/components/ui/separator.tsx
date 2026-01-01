<<<<<<< HEAD
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
=======
>>>>>>> 6d5602a (Save)
import type { ComponentPropsWithoutRef } from "react";
import { Root } from "@radix-ui/react-separator";
import { cn } from "../../lib/utils";

const Separator = ({ className, orientation = "horizontal", decorative = true, ...props }: ComponentPropsWithoutRef<typeof Root>) => (
  <Root
    decorative={decorative}
    orientation={orientation}
<<<<<<< HEAD
>>>>>>> Stashed changes
=======
>>>>>>> 6d5602a (Save)
    className={cn(
      "shrink-0 bg-border",
      orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
      className
    )}
<<<<<<< HEAD
<<<<<<< Updated upstream
    decorative={decorative}
    orientation={orientation}
=======
>>>>>>> Stashed changes
=======
>>>>>>> 6d5602a (Save)
    {...props}
  />
);
Separator.displayName = Root.displayName;

export { Separator };
