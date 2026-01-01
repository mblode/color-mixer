<<<<<<< HEAD
<<<<<<< Updated upstream
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
=======
=======
>>>>>>> 6d5602a (Save)
import type { ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background",
<<<<<<< HEAD
>>>>>>> Stashed changes
=======
>>>>>>> 6d5602a (Save)
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_12px_30px_-18px_rgba(227,28,95,0.6)] hover:bg-primary/90",
<<<<<<< HEAD
<<<<<<< Updated upstream
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
=======
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
>>>>>>> Stashed changes
=======
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
>>>>>>> 6d5602a (Save)
        outline: "border border-input bg-background hover:bg-muted/60",
        ghost: "hover:bg-muted/60",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

<<<<<<< HEAD
<<<<<<< Updated upstream
const Button = ({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) => {
=======
const Button = ({ className, variant, size, asChild = false, ...props }: ButtonProps) => {
>>>>>>> Stashed changes
=======
const Button = ({ className, variant, size, asChild = false, ...props }: ButtonProps) => {
>>>>>>> 6d5602a (Save)
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
};
Button.displayName = "Button";

export { Button, buttonVariants };
