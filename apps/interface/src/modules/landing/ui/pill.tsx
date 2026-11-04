import { cn } from "#/lib/utils.js";
import type { ReactNode } from "react";

/** Brand puzzle colours (yellow takes black text, the rest white), plus a black redaction bar. */
const PILL_COLORS = {
  orange: "bg-nemi-orange text-white",
  blue: "bg-nemi-blue text-white",
  yellow: "bg-nemi-yellow text-black",
  pink: "bg-nemi-pink text-white",
  green: "bg-nemi-green text-white",
  /** Redaction bar, the same black as the hidden wallet in the table. */
  redacted: "rounded-[5px] bg-black text-white dark:bg-white dark:text-black",
} as const;

/** Inline colour pill for a key word, the accent style used across nemi.fi. */
export function Pill({
  color,
  children,
  className,
}: {
  color: keyof typeof PILL_COLORS;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 font-semibold whitespace-nowrap",
        PILL_COLORS[color],
        className,
      )}
    >
      {children}
    </span>
  );
}
