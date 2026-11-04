import { cn } from "#/lib/utils.js";
import { useId, useState } from "react";

/**
 * The black bar that stands in for a wallet on Nemi. Hover, focus or a tap on it shows
 * "Nobody sees your wallet."
 */
export function HiddenWallet({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const tipId = useId();
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label="Wallet hidden"
        aria-describedby={tipId}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onBlur={() => setOpen(false)}
        className={cn(
          "block h-4 w-36 cursor-help rounded-sm bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:bg-white",
          className,
        )}
      />
      <span
        id={tipId}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute right-0 bottom-full z-20 mb-2 rounded-lg bg-black px-2.5 py-1.5 font-sans text-xs font-semibold tracking-normal whitespace-nowrap text-white normal-case opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 dark:bg-white dark:text-black",
          open && "opacity-100",
        )}
      >
        Nobody sees your wallet.
      </span>
    </span>
  );
}
