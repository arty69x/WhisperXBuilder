import { cn } from "@/lib/cn";
export function Button({ className, variant, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" }) { return <button className={cn("btn", variant === "primary" && "primary", className)} {...props} />; }
