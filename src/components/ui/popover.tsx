<<<<<<< HEAD
<<<<<<< Updated upstream
import { Content, Portal, Root, Trigger } from "@radix-ui/react-popover";
import type { ComponentPropsWithoutRef } from "react";
=======
import type { ComponentPropsWithoutRef } from "react";
import { Root, Trigger, Portal, Content } from "@radix-ui/react-popover";
>>>>>>> Stashed changes
=======
import type { ComponentPropsWithoutRef } from "react";
import { Root, Trigger, Portal, Content } from "@radix-ui/react-popover";
>>>>>>> 6d5602a (Save)
import { cn } from "../../lib/utils";

const Popover = Root;

const PopoverTrigger = Trigger;

<<<<<<< HEAD
<<<<<<< Updated upstream
const PopoverContent = ({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: ComponentPropsWithoutRef<typeof Content>) => (
  <Portal>
    <Content
      align={align}
      className={cn(
        "z-50 rounded-3xl border bg-card p-4 text-card-foreground shadow-lg outline-none",
        "data-[state=closed]:animate-out data-[state=open]:animate-in",
=======
=======
>>>>>>> 6d5602a (Save)
const PopoverContent = ({ className, align = "center", sideOffset = 4, ...props }: ComponentPropsWithoutRef<typeof Content>) => (
  <Portal>
    <Content
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 rounded-3xl border bg-card p-4 text-card-foreground shadow-lg outline-none",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
<<<<<<< HEAD
>>>>>>> Stashed changes
=======
>>>>>>> 6d5602a (Save)
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
<<<<<<< HEAD
<<<<<<< Updated upstream
      sideOffset={sideOffset}
=======
>>>>>>> Stashed changes
=======
>>>>>>> 6d5602a (Save)
      {...props}
    />
  </Portal>
);
PopoverContent.displayName = Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
