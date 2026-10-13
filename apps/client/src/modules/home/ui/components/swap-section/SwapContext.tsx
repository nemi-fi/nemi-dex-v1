import { useAccount } from "@/hooks/use-account";
import { safeParseCurrencyAmount } from "@/hooks/use-swap";
import { lib } from "@/lib/sdk";
import type { interfaceSdk } from "@nemi-fi/interface-sdk";
import { sutils } from "@nemi-fi/utils";
import React, {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTokenContext } from "./TokenContext";

// Define context type for swap-related states
type SwapContextType = {
  // Input values
  payValue: string;
  setPayValue: (value: string) => void;

  // Input refs for accessing the input elements
  payInputRef: RefObject<HTMLInputElement>;
  receiveInputRef: RefObject<HTMLInputElement>;

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

  // Token selection state
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<"pay" | "receive">(
    "pay",
  );

  const parsedAmount = useMemo(() => {
    // Use the original L2Token from the token object
    return safeParseCurrencyAmount(selectedToken?.l2Token, payValue);
  }, [selectedToken, payValue]);

  // Get quote when pay amount changes
  useEffect(() => {
    // Clear the quote if no amount or tokens
    if (!payValue || !selectedToken || !selectedOutputToken || !account) {
      setQuote(null);
      setIsCalculating(false);
      return;
    }

    if (parseFloat(payValue) <= 0) {
      setQuote(null);
      setIsCalculating(false);
      return;
    }

    // Set calculating state
    setIsCalculating(true);

    const getQuote = async () => {
      try {
        // Parse amount
        const parsedAmount = sutils.parseCurrencyAmount(
          selectedToken.l2Token,
          payValue,
        );

        const quoteResult = await lib.universalRouter.getQuote({
          account: account.address,
          amountIn: parsedAmount,
          currencyOut: selectedOutputToken.l2Token,
        });

        if (quoteResult) {
          setQuote(quoteResult);
        } else {
          setQuote(null);
        }
      } catch (error) {
        console.error("Error getting quote:", error);
        setQuote(null);
      } finally {
        // Finish calculating with a small delay to avoid UI flicker
        setTimeout(() => {
          setIsCalculating(false);
        }, 300);
      }
    };

    // Use a timer to debounce the quote fetching within the context
    const timer = setTimeout(getQuote, 800);
    return () => clearTimeout(timer);
  }, [payValue, selectedToken, selectedOutputToken, account, parsedAmount]);

  // Function to handle numeric input with only numbers and dots
  const handleNumericInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow only numbers and dots
    if (
      !/^\d$/.test(e.key) &&
      e.key !== "." &&
      e.key !== "Backspace" &&
      e.key !== "Delete" &&
      e.key !== "ArrowLeft" &&
      e.key !== "ArrowRight" &&
      e.key !== "Tab" &&
      !e.ctrlKey &&
      !e.metaKey
    ) {
      e.preventDefault();
    }

    // Prevent multiple dots
    if (e.key === "." && e.currentTarget.value.includes(".")) {
      e.preventDefault();
    }
  };

  // Open token selection modal
  const openTokenModal = (type: "pay" | "receive") => {
    setCurrentSelection(type);
    setIsTokenModalOpen(true);
  };

  // Close token selection modal
  const closeTokenModal = () => {
    setIsTokenModalOpen(false);
  };

  // Handle switching tokens using the swapTokens function from TokenContext
  const handleSwitchTokens = () => {
    // Swap tokens using the TokenContext's direct swap function
    swapTokens();

    // Clear input values and quote
    setPayValue("");
    setQuote(null);
  };

  // Create context value
  const contextValue: SwapContextType = {
    payValue,
    setPayValue,
    payInputRef: payInputRef as RefObject<HTMLInputElement>,
    receiveInputRef: receiveInputRef as RefObject<HTMLInputElement>,
    isTokenModalOpen,
    currentSelection,
    openTokenModal,
    closeTokenModal,
    handleSwitchTokens,
    handleNumericInput,
    isCalculating,
    quote,
    resetSwapForm: () => {
      setPayValue("");
      setQuote(null);
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
