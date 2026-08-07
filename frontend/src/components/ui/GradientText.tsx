import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}

/** The signature indigo→cyan clipped gradient used in every headline. */
export function GradientText({ children, className, as: Tag = "span" }: GradientTextProps) {
  return <Tag className={cn("accent-gradient-text", className)}>{children}</Tag>;
}
