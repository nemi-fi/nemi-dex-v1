import { cn } from "#/lib/utils.js";
import { CircleNotchIcon } from "@phosphor-icons/react";

export function Spinner({ className }: { className?: string }) {
  return (
    <CircleNotchIcon
      className={cn("h-8 w-8 animate-spin text-blue-600", className)}
      aria-label="Loading"
    />
  );
}

/** A spinner centred in a block of the given height class. */
export function LoadingBlock({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-48 items-center justify-center", className)}>
      <Spinner />
    </div>
  );
}
