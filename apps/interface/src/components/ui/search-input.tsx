import { Input } from "#/components/ui/input.js";
import { cn } from "#/lib/utils.js";
import { Search, X } from "lucide-react";
import type * as React from "react";

/** Text input with a leading search icon and, when `onClear` is given, a clear button. */
export function SearchInput({
  className,
  onClear,
  ...props
}: React.ComponentProps<"input"> & { onClear?: () => void }) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        aria-hidden="true"
      />
      <Input
        type="search"
        className={cn(
          "h-10 rounded-lg border-gray-200 pl-9 pr-9 text-sm  dark:border-neutral-600 dark:bg-neutral-700 [&::-webkit-search-cancel-button]:hidden",
          className,
        )}
        {...props}
      />
      {onClear && props.value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
