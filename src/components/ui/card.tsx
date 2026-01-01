import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "rounded-3xl border bg-card text-card-foreground shadow-[0_24px_70px_-50px_rgba(15,10,6,0.45)]",
      className
    )}
    {...props}
  />
);
Card.displayName = "Card";

<<<<<<< Updated upstream
const CardHeader = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
=======
const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
>>>>>>> Stashed changes
  <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />
);
CardHeader.displayName = "CardHeader";

<<<<<<< Updated upstream
const CardTitle = ({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn(
      "font-semibold text-lg leading-tight tracking-tight",
      className
    )}
=======
const CardTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn("text-lg font-semibold leading-tight tracking-tight", className)}
>>>>>>> Stashed changes
    {...props}
  />
);
CardTitle.displayName = "CardTitle";

<<<<<<< Updated upstream
const CardDescription = ({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-muted-foreground text-sm", className)} {...props} />
);
CardDescription.displayName = "CardDescription";

const CardContent = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
=======
const CardDescription = ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
);
CardDescription.displayName = "CardDescription";

const CardContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
>>>>>>> Stashed changes
  <div className={cn("px-6 pb-6", className)} {...props} />
);
CardContent.displayName = "CardContent";

<<<<<<< Updated upstream
const CardFooter = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
=======
const CardFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
>>>>>>> Stashed changes
  <div className={cn("flex items-center px-6 pb-6", className)} {...props} />
);
CardFooter.displayName = "CardFooter";

<<<<<<< Updated upstream
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
=======
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
>>>>>>> Stashed changes
