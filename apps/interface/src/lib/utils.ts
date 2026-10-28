import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Highlight for the selected item in nav bars and tab rows. */
export const activePillClassName =
  "bg-white font-semibold text-gray-900 shadow-sm ring-1 ring-black/10 dark:bg-neutral-600 dark:text-white dark:ring-white/15";
