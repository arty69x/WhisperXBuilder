import { cn } from "@/lib/cn";
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <article className={cn("card", className)} {...props} />; }
