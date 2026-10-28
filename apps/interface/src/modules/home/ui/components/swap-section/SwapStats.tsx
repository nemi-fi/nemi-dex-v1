"use client";

import { sutils } from "@nemi-fi/utils";
import { Check, Clock, Info, Star } from "lucide-react";
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
        icon={<Star className="h-4 w-4 fill-current text-yellow-500" />}
      />
      <StatRow
        label="Estimated Time"
        value="~2 minutes"
        icon={<Clock className="h-4 w-4 text-pink-400" />}
      />
      <StatRow
        label="Network Fee"
        value={
          <div className="flex items-center gap-2">
            <span className="line-through">$2.50</span>
            <span className="flex items-center gap-0.5 whitespace-nowrap rounded-sm border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:border-green-800/40 dark:bg-green-900/20 dark:text-green-400">
              <Check className="h-2.5 w-2.5" />
              Sponsored by Nemi
            </span>
          </div>
        }
        icon={<Info className="h-4 w-4 text-blue-400" />}
      />
    </section>
  );
};
