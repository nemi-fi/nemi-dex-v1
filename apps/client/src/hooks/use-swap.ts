import { useAccount } from "@/hooks/use-account";
import { lib } from "@/lib/sdk";
import type { interfaceSdk } from "@nemi-fi/interface-sdk";
import { sutils } from "@nemi-fi/utils";
import { L2Token } from "@nemi-fi/v1-sdk";
import { useCallback, useEffect, useMemo, useState } from "react";

export function safeParseCurrencyAmount(
  token: L2Token | undefined,
  amount: string,
) {
  if (!token || !amount || isNaN(Number(amount))) {
    return undefined;
  }
  try {
    return sutils.parseCurrencyAmount(token, amount);
  } catch (e) {
    console.error("Error parsing currency amount:", e);
    return undefined;
  }
}

/**
 * Custom hook for managing swap functionality
 */
export const useSwap = () => {
  // State for token selection
  const [fromToken, setFromToken] = useState<L2Token | undefined>();
  const [toToken, setToToken] = useState<L2Token | undefined>();

  // State for amounts
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");

  // State for errors and loading
  const [error, setError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  // Get wallet connection from lib
  const account = useAccount();

  // Get quote result
  const [quoteResult, setQuoteResult] = useState<interfaceSdk.IQuote | null>(
    null,
  );

  // Handle fetching a quote when the amount or tokens change
  useEffect(() => {
    let isMounted = true;
    // Only fetch a quote if we have all the required data
    if (!fromAmount || !fromToken || !toToken || !account) {
      setQuoteResult(null);
      setIsCalculating(false);
      return;
    }

    const fetchQuote = async () => {
      setIsCalculating(true);
      const amountIn = safeParseCurrencyAmount(fromToken, fromAmount);

      if (!amountIn) {
        setIsCalculating(false);
        return;
      }

      try {
        // Get quote from the SDK
        const result = await lib.universalRouter.getQuote({
          account: account.address,
          amountIn: amountIn,
          currencyOut: toToken,
        });

        if (isMounted) {
          setQuoteResult(result || null);
          // Immediately set calculating to false once we have a result
          setIsCalculating(false);
        }
      } catch (err) {
        console.error("Error fetching quote:", err);
        if (isMounted) {
          setQuoteResult(null);
          setError("Failed to get quote");
          setIsCalculating(false);
        }
      }
    };

    // Debounce the fetch call to avoid too many requests
    const timerId = setTimeout(fetchQuote, 500);

    return () => {
      isMounted = false;
      clearTimeout(timerId);
    };
  }, [fromAmount, fromToken, toToken, account]);

  // Execute swap transaction
  const executeSwap = async (quoteToUse: interfaceSdk.IQuote) => {
    if (!account) {
      console.error(`Cannot execute swap: Missing account`);
      setError(`Cannot execute swap: Missing account`);
      return null;
    }

    if (!fromToken || !toToken) {
      console.error(`Cannot execute swap: Missing token information`);
      setError(`Cannot execute swap: Missing token information`);
      return null;
    }

    setIsSwapping(true);
    setError(null);

    try {
      // Execute the swap transaction using the quote
      const txResult = await lib.universalRouter.executeQuote(
        account,
        quoteToUse,
      );

      console.log("Swap execution result:", txResult);

      // Reset amount fields after successful swap
      if (txResult) {
        setFromAmount("");
        setQuoteResult(null);
      }

      return txResult;
    } catch (err) {
      console.error("Error executing swap:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to execute swap";
      console.error("Error message:", errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsSwapping(false);
    }
  };

  // Format output amount for display
  const displayToAmount = useMemo(() => {
    if (isCalculating) return "...";
    if (quoteResult?.amountOut) {
      // Format the output amount for display
      return formatAmountForDisplay(quoteResult.amountOut);
    }
    return toAmount || "";
  }, [quoteResult, isCalculating, toAmount]);

  // Handle from amount change
  const handleFromAmountChange = useCallback((amount: string) => {
    setFromAmount(amount);
    setError(null);
    setIsCalculating(!!amount);
  }, []);

  // Switch tokens places
  const handleSwapTokens = useCallback(() => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount("");
    setToAmount("");
    setQuoteResult(null);
  }, [fromToken, toToken]);

  return {
    fromToken,
    toToken,
    fromAmount,
    toAmount: displayToAmount,
    error,
    isCalculating,
    isSwapping,
    quoteResult,
    executeSwap,
    handleFromAmountChange,
    handleSwapTokens,
    setFromToken,
    setToToken,
  };
};

// Helper function to format amount for display
function formatAmountForDisplay(amountObject: any) {
  if (!amountObject) return "";

  try {
    // Extract numeric value from the amount object
    let value = "";

    if (typeof amountObject === "string") {
      value = amountObject;
    } else if (typeof amountObject.toExact === "function") {
      value = amountObject.toExact();
    } else if (typeof amountObject.toString === "function") {
      value = amountObject.toString();
    } else if (amountObject.value) {
      value = amountObject.value.toString();
    } else {
      value = String(amountObject);
    }

    // Format to max 6 decimal places
    const numValue = Number(value);
    if (isNaN(numValue)) return value;
    return numValue.toFixed(6).replace(/\.?0+$/, "");
  } catch (e) {
    console.error("Error formatting amount:", e);
    return "";
  }
}
