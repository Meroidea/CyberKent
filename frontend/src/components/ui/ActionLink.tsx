import type { AnchorHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { springSnappy } from "@/lib/motion";

type Variant = "primary" | "secondary" | "ghost";

/**
 * React's own drag and animation handlers collide with Framer's props of the
 * same name, so they are dropped rather than forwarded.
 */
type PassthroughAnchorProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onDragEnter"
  | "onDragLeave"
  | "onDragOver"
  | "onDrop"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
>;

interface ActionLinkProps extends PassthroughAnchorProps {
  children: ReactNode;
  variant?: Variant;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 dark:from-indigo-500 dark:to-cyan-400 dark:text-slate-950",
  secondary:
    "glass-surface text-slate-700 hover:border-indigo-300 hover:text-indigo-700 dark:text-slate-200 dark:hover:border-cyan-400/40 dark:hover:text-cyan-300",
  ghost:
    "text-slate-600 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-cyan-300",
};

/**
 * The single call-to-action element for the marketing surface.
 * Renders an anchor so it works before the router exists.
 *
 * Lift on hover and compression on press are springs rather than CSS
 * transitions: a press released mid-transition settles from wherever it had
 * reached instead of snapping, which is what makes the control feel physical
 * rather than scripted. Colour and shadow stay on CSS transitions — they carry
 * no momentum, so a spring would only make them late.
 */
export function ActionLink({ children, variant = "primary", className, ...rest }: ActionLinkProps) {
  return (
    <motion.a
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97, y: 0 }}
      transition={springSnappy}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-[background-color,border-color,color,box-shadow] duration-200 ease-out",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </motion.a>
  );
}
