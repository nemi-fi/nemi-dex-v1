"use client";

import { sutils } from "@nemi-fi/utils";
import { Percent } from "lucide-react";
import React from "react";
import { useSwapContext } from "./SwapContext";
import { useTokenContext } from "./TokenContext";

// Reusable stat row component
type StatRowProps = {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  labelClassNames?: string;
};

const StatRow: React.FC<StatRowProps> = ({
  label,
  value,
  icon,
  labelClassNames = "text-gray-600",
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-sm">
      <span className="flex-shrink-0">{icon}</span>
      <span className={labelClassNames}>{label}</span>
    </div>
    <div className="text-sm">{value}</div>
  </div>
);

export const SwapStats: React.FC = () => {
  const { quote, payValue } = useSwapContext();
  const { selectedToken, selectedOutputToken } = useTokenContext();

  const hasQuoteResult = !!quote;

  const iconClasses = "w-[16px] h-[16px]";

  const exchangeRateIcon = (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${iconClasses} text-yellow-500`}
      aria-hidden="true"
    >
      <path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        stroke="currentColor"
        fill="currentColor"
      />
    </svg>
  );

  const timeIcon = (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${iconClasses} text-pink-400`}
      aria-hidden="true"
    >
      <path
        d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM16.2 16.2L11 13V7H12.5V12.2L17 14.9L16.2 16.2Z"
        fill="currentColor"
      />
    </svg>
  );

  const slippageIcon = (
    <Percent className={`${iconClasses} text-yellow-400`} aria-hidden="true" />
  );

  const feeIcon = (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${iconClasses} text-blue-400`}
      aria-hidden="true"
    >
      <path
        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z"
        fill="currentColor"
      />
      <path
        d="M12 17L12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 9L12 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  const checkIcon = (
    <svg
      width="8"
      height="8"
      viewBox="0 0 24 24"
      fill="none"
      className="w-[10px] h-[10px] mr-0.5"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M20 6L9 17L4 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="text-green-600"
      />
    </svg>
  );

  return (
    <section
      className={`mt-3 pt-3 border-t border-gray-100 space-y-2 transition-all duration-300 ease-in-out ${
        hasQuoteResult
          ? "opacity-100 max-h-[500px] overflow-visible"
          : "opacity-0 max-h-0 overflow-hidden"
      }`}
      aria-label="Swap details and statistics"
    >
      {quote && (
        <>
          <StatRow
            label="Exchange Rate"
            value={
              <span className="text-sm font-medium">
                {sutils.displayPrice(quote.executionPrice)}
              </span>
            }
            icon={exchangeRateIcon}
          />

          <StatRow
            label="Estimated Time"
            value={<span className="text-sm font-medium">~2 minutes</span>}
            icon={timeIcon}
          />

          {/* <StatRow
            label="Slippage Tolerance"
            value={<span className="text-sm font-medium">{getSlippage()}</span>}
            icon={slippageIcon}
          /> */}

          <StatRow
            label="Network Fee"
            value={
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium line-through">$2.50</span>
                <div className="bg-green-50 rounded-sm px-2 py-0.5 border border-green-200">
                  <span className="text-green-600 font-medium text-[10px] flex items-center whitespace-nowrap">
                    {checkIcon}
                    Sponsored by Nemi
                  </span>
                </div>
              </div>
            }
            icon={feeIcon}
          />
        </>
      )}
    </section>
  );
};

SwapStats.displayName = "SwapStats";
