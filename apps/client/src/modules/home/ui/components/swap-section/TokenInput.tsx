import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSvelte } from "@/hooks/use-svelte";
import { lib } from "@/lib/sdk";
import { sutils } from "@nemi-fi/utils";
import { forwardRef } from "react";
import { useSwapContext } from "./SwapContext";
import { useTokenContext } from "./TokenContext";

type TokenInputProps = {
  label: string;
  labelColor: string;
  inputType: "pay" | "receive";
};

const LoadingTokenButton = () => (
  <Button
    variant="ghost"
    className="rounded-full h-8 px-3 bg-white dark:bg-zinc-800 border-0 shadow-sm text-sm font-medium flex items-center gap-2 min-w-fit transition-colors"
    type="button"
    disabled
    aria-label="Loading token"
  >
    <>
      <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-zinc-700 animate-pulse"></div>
      <span className="w-14 h-5 bg-gray-200 dark:bg-zinc-700 animate-pulse rounded"></span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-4 h-4 ml-0.5 text-gray-300 dark:text-zinc-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </>
  </Button>
);

// Added skeleton loading component for the input field
const LoadingInputSkeleton = () => (
  <div className="flex-1 h-8 bg-gray-200 dark:bg-zinc-700 animate-pulse rounded"></div>
);

export const TokenInput = forwardRef<HTMLInputElement, TokenInputProps>(
  ({ label, labelColor, inputType }, ref) => {
    // TODO(security): nuke this component because it handles stuff wrong

    // Get token data from context
    const { selectedToken, selectedOutputToken } = useTokenContext();
    const currencies = useSvelte(() => lib.currencyList.currencies);
    // Get swap functionality from context
    const {
      payValue,
      setPayValue,
      handleNumericInput,
      openTokenModal,
      isCalculating,
      quote,
    } = useSwapContext();

    // Determine which token and value to use based on inputType
    const token = inputType === "pay" ? selectedToken : selectedOutputToken;

    // For receive input, we want to show the quoted amount
    const displayValue =
      inputType === "pay"
        ? payValue
        : isCalculating
          ? "..." // Show loading indicator while calculating
          : quote?.amountOut
            ? sutils.formatCurrencyAmount(quote.amountOut)
            : "0.00"; // Show quoted amount when available

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (inputType === "pay") {
        setPayValue(value);
      }
      // Ignore change events for the receive input since it's disabled
    };

    return (
      <div
        className="rounded-lg p-3 bg-gray-50 dark:bg-zinc-900/60 hover:bg-gray-100 dark:hover:bg-zinc-800/80 transition-colors cursor-text"
        onClick={() => {
          // Only focus the input if it's the pay field (not disabled)
          if (ref && "current" in ref && ref.current && inputType === "pay") {
            ref.current.focus();
          }
        }}
        role="presentation"
      >
        <div className="flex items-center gap-3">
          {currencies.length === 0 ? (
            <LoadingInputSkeleton />
          ) : (
            <Input
              ref={ref}
              placeholder="0.00"
              type="text"
              className={`shadow-none flex-1 border-none text-xl font-normal bg-transparent dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto ${
                inputType === "receive"
                  ? "cursor-not-allowed opacity-80"
                  : "cursor-text"
              }`}
              onKeyDown={handleNumericInput}
              inputMode="decimal"
              value={displayValue}
              onChange={handleChange}
              disabled={inputType === "receive"} // Disable input for receive field
              aria-label={`${inputType === "pay" ? "Enter" : "View"} ${label} amount`}
            />
          )}

          {currencies.length === 0 ? (
            <LoadingTokenButton />
          ) : (
            <Button
              variant="ghost"
              className="rounded-full h-8 px-3 bg-white dark:bg-zinc-800 border-0 shadow-sm text-sm font-medium flex items-center gap-2 min-w-fit transition-colors hover:bg-gray-50 dark:hover:bg-zinc-700 active:bg-gray-100 dark:active:bg-zinc-700/80"
              onClick={(e) => {
                e.stopPropagation();
                openTokenModal(inputType);
              }}
              type="button"
              aria-label={`Select ${token.name} token`}
            >
              <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                {token.logo}
              </div>
              <span className="truncate max-w-[60px] dark:text-white">
                {token.symbol}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 ml-0.5 dark:text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </Button>
          )}
        </div>
      </div>
    );
  },
);

TokenInput.displayName = "TokenInput";
