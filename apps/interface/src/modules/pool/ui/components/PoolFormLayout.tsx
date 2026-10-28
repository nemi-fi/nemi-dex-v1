import { cn } from "#/lib/utils.js";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

/** Page shell shared by the add and remove liquidity forms. */
export function PoolFormLayout({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description: string;
  /** Max-width utilities for the form column. */
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full", className)}>
      <Link
        to="/pool"
        className="mb-6 inline-flex items-center gap-2 text-gray-700 transition-colors hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Pools
      </Link>
      <h1 className="mb-3 text-3xl font-bold">{title}</h1>
      <p className="mb-8 text-gray-600 dark:text-gray-400">{description}</p>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        {children}
      </div>
    </div>
  );
}
