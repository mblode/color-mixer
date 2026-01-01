<<<<<<< HEAD
<<<<<<< Updated upstream
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
=======
=======
>>>>>>> 6d5602a (Save)
import type { ComponentPropsWithoutRef } from "react";
import { Root } from "@radix-ui/react-label";
import { cn } from "../../lib/utils";

const Label = ({ className, ...props }: ComponentPropsWithoutRef<typeof Root>) => (
  <Root
    className={cn(
      "text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
<<<<<<< HEAD
>>>>>>> Stashed changes
=======
>>>>>>> 6d5602a (Save)
      className
    )}
    {...props}
  />
);
Label.displayName = Root.displayName;

export { Label };
