import { useAccount } from "#/hooks/use-account.js";
import { handleAmountKeyDown } from "#/lib/amount-input.js";
import { useTokenSelectorModal } from "#/hooks/use-token-selector-modal.js";
import { lib } from "#/lib/sdk.js";
import type { interfaceSdk } from "@nemi-fi/interface-sdk";
import { sutils } from "@nemi-fi/utils";
import React, {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTokenContext } from "./TokenContext.js";

// Define context type for swap-related states
type SwapContextType = {
  // Input values
  payValue: string;
  setPayValue: (value: string) => void;

  // Input refs for accessing the input elements
  payInputRef: RefObject<HTMLInputElement | null>;
  receiveInputRef: RefObject<HTMLInputElement | null>;

  // Token selection
  isTokenModalOpen: boolean;
  currentSelection: "pay" | "receive";
  openTokenModal: (type: "pay" | "receive") => void;
  closeTokenModal: () => void;

  // Token switching
  handleSwitchTokens: () => void;

  // Form reset
  resetSwapForm: () => void;

  // Numeric input handling
  handleNumericInput: (e: React.KeyboardEvent<HTMLInputElement>) => void;

  // Quote data
  isCalculating: boolean;
  quote: interfaceSdk.IQuote | null;
  /** Set when the latest quote request finished without a usable quote (e.g., no liquidity). */
  quoteError: string | null;
};

// Create context with default undefined value
const SwapContext = createContext<SwapContextType | undefined>(undefined);

// Provider component
export const SwapProvider = ({ children }: { children: ReactNode }) => {
  // Get token context
  const { selectedToken, selectedOutputToken, swapTokens } = useTokenContext();

  const account = useAccount();

  // Refs for inputs
  const payInputRef = useRef<HTMLInputElement>(null);
  const receiveInputRef = useRef<HTMLInputElement>(null);

  // State for input values
  const [payValue, setPayValue] = useState("");

  // State for quote data
  const [isCalculating, setIsCalculating] = useState(false);
  const [quote, setQuote] = useState<interfaceSdk.IQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const tokenSelector = useTokenSelectorModal();

  // Get quote when pay amount changes
  useEffect(() => {
    setQuoteError(null);

    const tokenIn = selectedToken.l2Token;
    const tokenOut = selectedOutputToken.l2Token;

    // Clear the quote if no amount or tokens (placeholders have no `l2Token` yet)
    if (!payValue || !tokenIn || !tokenOut || !account) {
      setQuote(null);
      setIsCalculating(false);
      return;
    }

    if (!(parseFloat(payValue) > 0)) {
      setQuote(null);
      setIsCalculating(false);
      return;
    }

    // Set calculating state
    setIsCalculating(true);

    // Results of a request that was superseded by newer input are dropped, otherwise a
    // slow quote for an old amount could overwrite the quote for the current one.
    let isStale = false;

    const getQuote = async () => {
      try {
        // Parse amount
        const parsedAmount = sutils.parseCurrencyAmount(tokenIn, payValue);

        const quoteResult = await lib.universalRouter.getQuote({
          account: account.address,
          amountIn: parsedAmount,
          currencyOut: tokenOut,
        });

        if (isStale) return;
        setQuote(quoteResult ?? null);
        if (!quoteResult?.amountOut.greaterThan(0)) {
          setQuoteError(
            `Not enough liquidity to swap ${selectedToken.symbol} for ${selectedOutputToken.symbol}`,
          );
        }
      } catch (error) {
        console.error("Error getting quote:", error);
        if (isStale) return;
        setQuote(null);
        setQuoteError("Unable to get a quote for this swap");
      } finally {
        if (!isStale) setIsCalculating(false);
      }
    };

    // Use a timer to debounce the quote fetching within the context
    const timer = setTimeout(getQuote, 800);
    return () => {
      isStale = true;
      clearTimeout(timer);
    };
  }, [payValue, selectedToken, selectedOutputToken, account]);

  // Handle switching tokens using the swapTokens function from TokenContext
  const handleSwitchTokens = () => {
    // Swap tokens using the TokenContext's direct swap function
    swapTokens();

    // Clear input values and quote
    setPayValue("");
    setQuote(null);
    setQuoteError(null);
  };

  // Create context value
  const contextValue: SwapContextType = {
    payValue,
    setPayValue,
    payInputRef,
    receiveInputRef,
    isTokenModalOpen: tokenSelector.isOpen,
    currentSelection: tokenSelector.side,
    openTokenModal: tokenSelector.open,
    closeTokenModal: tokenSelector.close,
    handleSwitchTokens,
    handleNumericInput: handleAmountKeyDown,
    isCalculating,
    quote,
    quoteError,
    resetSwapForm: () => {
      setPayValue("");
      setQuote(null);
      setQuoteError(null);
    },
  };

  return (
    <SwapContext.Provider value={contextValue}>{children}</SwapContext.Provider>
  );
};

// Custom hook to use the swap context
export const useSwapContext = () => {
  const context = useContext(SwapContext);
  if (context === undefined) {
    throw new Error("useSwapContext must be used within a SwapProvider");
  }
  return context;
};
