"use client";

import { sutils } from "@nemi-fi/utils";
import { ClockIcon, StarIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useSwapContext } from "./SwapContext.js";

const StatRow = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-sm">
      <span className="flex-shrink-0" aria-hidden="true">
        {icon}
      </span>
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
    </div>
    <div className="text-sm font-medium">{value}</div>
  </div>
);

export const SwapStats = () => {
  const { quote } = useSwapContext();
  if (!quote) {
    return null;
  }

  return (
    <section
      className="mt-3 space-y-2 border-t border-gray-100 pt-3 dark:border-neutral-700"
      aria-label="Swap details and statistics"
    >
      <StatRow
        label="Exchange Rate"
        value={sutils.displayPrice(quote.executionPrice)}
        icon={<StarIcon className="h-4 w-4 fill-current text-yellow-500" />}
      />
      <StatRow
        label="Estimated Time"
        value="~30 seconds"
        icon={<ClockIcon className="h-4 w-4 text-pink-400" />}
      />
    </section>
  );
};
