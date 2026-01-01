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

<<<<<<< HEAD
<<<<<<< Updated upstream
const CardHeader = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
=======
const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
>>>>>>> Stashed changes
=======
const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
>>>>>>> 6d5602a (Save)
  <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />
);
CardHeader.displayName = "CardHeader";

<<<<<<< HEAD
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
=======
const CardTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn("text-lg font-semibold leading-tight tracking-tight", className)}
>>>>>>> 6d5602a (Save)
    {...props}
  />
);
CardTitle.displayName = "CardTitle";

<<<<<<< HEAD
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
=======
>>>>>>> 6d5602a (Save)
const CardDescription = ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
);
CardDescription.displayName = "CardDescription";

const CardContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
<<<<<<< HEAD
>>>>>>> Stashed changes
=======
>>>>>>> 6d5602a (Save)
  <div className={cn("px-6 pb-6", className)} {...props} />
);
CardContent.displayName = "CardContent";

<<<<<<< HEAD
<<<<<<< Updated upstream
const CardFooter = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
=======
const CardFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
>>>>>>> Stashed changes
=======
const CardFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
>>>>>>> 6d5602a (Save)
  <div className={cn("flex items-center px-6 pb-6", className)} {...props} />
);
CardFooter.displayName = "CardFooter";

<<<<<<< HEAD
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
=======
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
>>>>>>> 6d5602a (Save)
