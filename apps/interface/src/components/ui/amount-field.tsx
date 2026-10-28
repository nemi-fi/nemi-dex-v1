import { Skeleton } from "#/components/ui/skeleton.js";
import { cn } from "#/lib/utils.js";
import { ArrowDownUp, ChevronDown } from "lucide-react";
import type * as React from "react";

export function FieldLabel({
  className,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "flex items-center text-sm font-medium text-gray-700 dark:text-gray-300",
        className,
      )}
      {...props}
    />
  );
}

/** The rounded box that holds an amount input and its token pill. */
export function AmountField({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 py-3 transition-all duration-200 hover:border-gray-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 dark:border-neutral-600 dark:bg-neutral-700 dark:hover:border-neutral-500",
        className,
      )}
      {...props}
    />
  );
}

/** Placeholder for an `AmountField` while tokens or balances load. */
export function AmountFieldSkeleton() {
  return (
    <AmountField>
      <Skeleton className="h-8 flex-1" />
      <Skeleton className="h-10 w-28 rounded-lg" />
    </AmountField>
  );
}

export const amountInputClassName =
  "w-full min-w-0 flex-1 bg-transparent text-2xl font-medium placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed dark:text-white dark:placeholder:text-neutral-400";

/** Token selector chip inside an `AmountField`: the token's logo, symbol and a chevron. */
export function TokenPill({
  logo,
  symbol,
  showChevron = true,
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "children"> & {
  logo?: React.ReactNode;
  symbol?: string;
  showChevron?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-8 min-w-fit shrink-0 items-center gap-2 rounded-full bg-white px-3 text-sm font-medium shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:cursor-default disabled:hover:bg-white dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 dark:active:bg-zinc-700/80 dark:disabled:hover:bg-zinc-800",
        className,
      )}
      {...props}
    >
      {logo && (
        <span className="h-5 w-5 shrink-0 overflow-hidden rounded-full">
          {logo}
        </span>
      )}
      <span className="max-w-[90px] truncate">{symbol || "Select"}</span>
      {showChevron && (
        <ChevronDown className="h-4 w-4 shrink-0 dark:text-gray-400" />
      )}
    </button>
  );
}

/** Square badge between two amount fields; a button when `onClick` is given. */
export function FieldDivider({
  icon = <ArrowDownUp className="h-[18px] w-[18px]" />,
  onClick,
  label,
}: {
  icon?: React.ReactNode;
  onClick?: () => void;
  label?: string;
}) {
  const className = cn(
    "rounded-lg border border-gray-200 bg-white p-2.5 text-gray-600 shadow-sm transition-colors dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-300",
    onClick && "hover:bg-gray-50 dark:hover:bg-neutral-700",
  );
  return (
    <div className="relative z-10 my-3 flex justify-center">
      {onClick ? (
        <button
          type="button"
          className={className}
          onClick={onClick}
          aria-label={label}
        >
          {icon}
        </button>
      ) : (
        <span className={className} aria-hidden="true">
          {icon}
        </span>
      )}
    </div>
  );
}
