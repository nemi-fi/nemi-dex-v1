import { cn } from "#/lib/utils.js";
import { Loader2 } from "lucide-react";

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
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
