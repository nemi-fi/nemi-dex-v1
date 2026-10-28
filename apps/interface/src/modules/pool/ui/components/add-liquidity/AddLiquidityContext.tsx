"use client";

import { useAccount } from "#/hooks/use-account.js";
import { handleAmountKeyDown } from "#/lib/amount-input.js";
import { usePools } from "#/lib/queries.js";
import { lib } from "#/lib/sdk.js";
import { TransactionDetailRow, TxModal } from "#/components/TxModal.js";
import { modals } from "#/lib/modal.js";
import { toast } from "#/lib/toast.js";
import { ArrowDownToLine } from "lucide-react";
import { useTokenContext } from "#/modules/home/ui/components/swap-section/TokenContext.js";
import { type Token } from "#/modules/home/ui/components/swap-section/types.js";
import { interfaceSdk } from "@nemi-fi/interface-sdk";
import { sutils } from "@nemi-fi/utils";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

interface AddLiquidityContextProps {
  amountA: string;
  amountB: string;
  setAmountA: (value: string) => void;
  setAmountB: (value: string) => void;
  handleNumericInput: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isCalculating: boolean;
  pool: any;
  addLiquidity: () => Promise<void>;
  isPoolExisting: boolean | null;
  allowBothInputs: boolean;
  shouldAutoFill: boolean;
  isPoolLoading: boolean;
}

const AddLiquidityContext = createContext<AddLiquidityContextProps | undefined>(
  undefined,
);

export const useAddLiquidityContext = () => {
  const context = useContext(AddLiquidityContext);
  if (!context) {
    throw new Error(
      "useAddLiquidityContext must be used within an AddLiquidityProvider",
    );
  }
  return context;
};

export const AddLiquidityProvider = ({ children }: { children: ReactNode }) => {
  const account = useAccount();
  const pools = usePools();
  const { selectedToken, selectedOutputToken, isTokensLoading } =
    useTokenContext();
  const [, startTransition] = useTransition();
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [isManualB, setIsManualB] = useState(false); // Track if user manually modified amountB
  const [isCalculating, setIsCalculating] = useState(false);

  const pool = useMemo(() => {
    // Return null if tokens are still loading or don't have valid L2 tokens
    if (
      isTokensLoading ||
      !selectedToken?.l2Token?.address ||
      !selectedOutputToken?.l2Token?.address
    ) {
      return null;
    }

    try {
      return pools.data?.find((pool) => {
        try {
          const [token0, token1] = sutils.sortTokens(
            selectedOutputToken.l2Token,
            selectedToken.l2Token,
          );
          return token0.equals(pool.token0) && token1.equals(pool.token1);
        } catch (error) {
          console.error("Error in finding position:", error);
          return false;
        }
      });
    } catch (error) {
      console.error("Error in selecting position:", error);
      return null;
    }
  }, [pools.data, selectedOutputToken, selectedToken, isTokensLoading]);

  // Only allow both inputs if the pool exists but reserves are zero
  const allowBothInputs = Boolean(pool && pool.reserve0.equalTo(0));
  const shouldAutoFill = !allowBothInputs;
  const isPoolLoading =
    pools.data === null && !isTokensLoading ? true : pools.isLoading;

  // Quote amount B based on amount A for existing pool
  const quoteAmountForExistingPool = useCallback(
    async (amount: string, token: Token | undefined, otherAmount: string) => {
      const thisAmount = amount?.toString().trim() ?? "";
      if (!token?.l2Token?.address || !thisAmount || !pool || !shouldAutoFill) {
        console.log("Cannot quote: missing token, amount, or pool data");
        return otherAmount || "";
      }

      try {
        // Use the SDK's quoteLiquidity function if available
        if (pool && interfaceSdk?.quoteLiquidity) {
          console.log("Quoting using interfaceSdk.quoteLiquidity");
          const parsedAmount = sutils.parseCurrencyAmount(
            token.l2Token,
            amount,
          );
          const quoted = interfaceSdk.quoteLiquidity({
            amountA: parsedAmount,
            pool: pool,
          });

          if (quoted) {
            const formattedAmount = sutils.formatCurrencyAmount(quoted);
            console.log("Quote result:", {
              input: amount,
              output: formattedAmount,
            });
            return formattedAmount;
          }
        }

        // Fallback to a simulated quote for demonstration
        console.log("Using fallback quote calculation");
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Calculate a simple ratio-based amount (this is just for demo purposes)
        // In a real implementation, you would use the pool's actual ratio
        if (pool) {
          if (shouldAutoFill) {
            const isToken0 = token.l2Token.address === pool.token0.address;

            // Convert currency amounts to numbers for calculation
            const reserve0Value = parseFloat(
              sutils.formatCurrencyAmount(pool.reserve0),
            );
            const reserve1Value = parseFloat(
              sutils.formatCurrencyAmount(pool.reserve1),
            );

            // Calculate the ratio based on which token is being entered
            const ratio = isToken0
              ? reserve1Value / reserve0Value
              : reserve0Value / reserve1Value;

            const calculatedAmount = (parseFloat(amount) * ratio).toFixed(6);
            console.log(
              "Calculated amount based on reserves:",
              calculatedAmount,
              "ratio:",
              ratio,
            );
            return calculatedAmount;
          }
        }

        // If we can't calculate a proper amount, return a placeholder
        return parseFloat(amount) === 0 ? "" : parseFloat(amount).toString();
      } catch (error) {
        console.error("Error in quoteAmountForExistingPool:", error);
        return "";
      }
    },
    [pool, shouldAutoFill],
  );

  // Generate quote for new pool creation (1:1 ratio if no specific ratio is defined)
  const generateQuoteForNewPool = useCallback(
    async (
      amount: string,
      tokenA: Token | undefined,
      tokenB: Token | undefined,
    ) => {
      if (!amount || !tokenA?.l2Token?.address || !tokenB?.l2Token?.address) {
        return "";
      }

      console.log("Generating quote for new pool creation");

      // For new pools, use the amount as is (1:1 ratio)
      // This is simple for demonstration - in reality you might want to
      // adjust based on token decimals or a suggested ratio
      try {
        const calculatedAmount = amount;
        return calculatedAmount;
      } catch (error) {
        console.error("Error in generateQuoteForNewPool:", error);
        return "";
      }
    },
    [],
  );

  // Update the setAmountA function to handle quote calculation
  const handleAmountAChange = useCallback(
    (value: string) => {
      // Set the value immediately for UI responsiveness
      setAmountA(value);
      // Reset manual flag when user modifies input A to re-enable auto-calculation. When
      // the pool lets the user set both amounts, keep amount B as they typed it.
      if (isManualB && !allowBothInputs) setIsManualB(false);
    },
    [isManualB, allowBothInputs],
  );

  // Separate handler for manual amountB input
  const handleAmountBChange = useCallback((value: string) => {
    setAmountB(value);
    // Set manual flag to prevent auto-calculation from overriding
    setIsManualB(true);
  }, []);

  // Calculate the amount of token B based on token A amount changes
  useEffect(() => {
    // If user has manually modified amountB and both inputs are allowed, skip auto-calculation
    if (isManualB && allowBothInputs) return;

    // Skip calculation if tokens are still loading
    if (
      isTokensLoading ||
      !selectedToken?.l2Token?.address ||
      !selectedOutputToken?.l2Token?.address ||
      !amountA ||
      amountA === "0" ||
      !shouldAutoFill
    ) {
      setAmountB("");
      return;
    }

    let isMounted = true;

    startTransition(async () => {
      try {
        setIsCalculating(true);
        const calculatedAmountB = pool
          ? await quoteAmountForExistingPool(amountA, selectedToken, amountB)
          : await generateQuoteForNewPool(
              amountA,
              selectedToken,
              selectedOutputToken,
            );

        if (!isMounted) return;

        // Only update amountB if user hasn't manually modified it
        if (!isManualB || !allowBothInputs) {
          setAmountB(calculatedAmountB);
        }
      } catch (error) {
        console.error("Error calculating amount B:", error);
        if (isMounted && (!isManualB || !allowBothInputs)) {
          setAmountB("");
        }
      } finally {
        if (isMounted) setIsCalculating(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [
    amountA,
    amountB,
    selectedToken,
    selectedOutputToken,
    pool,
    shouldAutoFill,
    allowBothInputs,
    isManualB,
    quoteAmountForExistingPool,
    generateQuoteForNewPool,
    isTokensLoading,
  ]);

  // Reset manual flag when tokens change
  useEffect(() => {
    setIsManualB(false);
    // Reset amounts when tokens change to prevent confusion
    setAmountA("");
    setAmountB("");
  }, [selectedToken?.id, selectedOutputToken?.id]);

  // Add liquidity function
  const addLiquidity = useCallback(async () => {
    if (
      !amountA ||
      !amountB ||
      !selectedToken?.l2Token?.address ||
      !selectedOutputToken?.l2Token?.address ||
      !account
    ) {
      toast.error("Missing required fields for adding liquidity");
      return;
    }

    const tokenA = selectedToken.l2Token;
    const tokenB = selectedOutputToken.l2Token;
    const symbolA = selectedToken.symbol;
    const symbolB = selectedOutputToken.symbol;
    let parsedAmountA, parsedAmountB;
    try {
      parsedAmountA = sutils.parseCurrencyAmount(tokenA, amountA);
      parsedAmountB = sutils.parseCurrencyAmount(tokenB, amountB);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid amount");
      return;
    }

    // Run the tx through the shared TxModal so the flow (review -> proving -> sent, with a
    // copyable transaction hash) matches swap.
    modals.show(TxModal, {
      details: (
        <>
          <TransactionDetailRow
            icon={<ArrowDownToLine className="h-4 w-4" />}
            label={`Deposit ${symbolA}`}
            value={sutils.displayCurrencyAmount(parsedAmountA)}
          />
          <TransactionDetailRow
            icon={<ArrowDownToLine className="h-4 w-4" />}
            label={`Deposit ${symbolB}`}
            value={sutils.displayCurrencyAmount(parsedAmountB)}
          />
        </>
      ),
      sendTx: async () => {
        const tx = await lib.amm.addLiquidity({
          account,
          amountA: parsedAmountA,
          amountB: parsedAmountB,
        });
        // The SDK's transaction tracker already toasts the confirm/fail lifecycle of this tx;
        // here we only run the local side effects once it confirms. Errors are surfaced by that
        // toast, so we don't catch (and swallow) them here.
        void tx.wait().then(() => {
          setAmountA("");
          setAmountB("");
          setIsManualB(false);
          pools.refetch();
        });
        return tx;
      },
    });
  }, [amountA, amountB, selectedToken, selectedOutputToken, account, pools]);

  return (
    <AddLiquidityContext.Provider
      value={{
        amountA,
        amountB,
        setAmountA: handleAmountAChange,
        setAmountB: allowBothInputs ? handleAmountBChange : setAmountB,
        handleNumericInput: handleAmountKeyDown,
        isCalculating,
        pool,
        addLiquidity,
        isPoolExisting: !!pool,
        allowBothInputs,
        shouldAutoFill,
        isPoolLoading,
      }}
    >
      {children}
    </AddLiquidityContext.Provider>
  );
};
