"use client";

import { useAccount } from "#/hooks/use-account.js";
import { handleAmountKeyDown } from "#/lib/amount-input.js";
import { usePools } from "#/lib/queries.js";
import { lib } from "#/lib/sdk.js";
import { TransactionDetailRow, TxModal } from "#/components/TxModal.js";
import { modals } from "#/lib/modal.js";
import { toast } from "#/lib/toast.js";
import { ArrowLineDownIcon } from "@phosphor-icons/react";
import { useTokenContext } from "#/modules/home/ui/components/swap-section/TokenContext.js";
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
} from "react";

interface AddLiquidityContextProps {
  amountA: string;
  amountB: string;
  setAmountA: (value: string) => void;
  setAmountB: (value: string) => void;
  handleNumericInput: (e: React.KeyboardEvent<HTMLInputElement>) => void;
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
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");

  const pool = useMemo(() => {
    // Return null if tokens are still loading or don't have valid L2 tokens
    const tokenA = selectedToken?.l2Token;
    const tokenB = selectedOutputToken?.l2Token;
    if (isTokensLoading || !tokenA || !tokenB) {
      return null;
    }

    try {
      return pools.data?.find((pool) => {
        try {
          const [token0, token1] = sutils.sortTokens(tokenB, tokenA);
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

  const isPoolLoading =
    pools.data === null && !isTokensLoading ? true : pools.isLoading;

  // The user sets both amounts, and so the price, when the pool doesn't exist yet or is empty.
  // Otherwise amount B follows from amount A at the pool's current ratio.
  const allowBothInputs =
    !isTokensLoading &&
    !isPoolLoading &&
    (!pool || pool.reserve0.equalTo(0) || pool.reserve1.equalTo(0));
  const shouldAutoFill = !allowBothInputs;

  // Calculate amount B from amount A at the pool's current ratio
  useEffect(() => {
    if (!shouldAutoFill) return;

    if (!pool || !selectedToken?.l2Token?.address || !amountA) {
      setAmountB("");
      return;
    }

    try {
      const quoted = interfaceSdk.quoteLiquidity({
        amountA: sutils.parseCurrencyAmount(selectedToken.l2Token, amountA),
        pool,
      });
      setAmountB(quoted ? sutils.formatCurrencyAmount(quoted) : "");
    } catch (error) {
      // e.g. amount A is not a valid number yet
      setAmountB("");
    }
  }, [amountA, selectedToken, pool, shouldAutoFill]);

  useEffect(() => {
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
      publicData: [
        { label: "Action", value: `Add ${symbolA}/${symbolB} liquidity` },
        {
          label: `${symbolA} amount`,
          value: sutils.displayCurrencyAmount(parsedAmountA),
        },
        {
          label: `${symbolB} amount`,
          value: sutils.displayCurrencyAmount(parsedAmountB),
        },
      ],
      details: (
        <>
          <TransactionDetailRow
            icon={<ArrowLineDownIcon className="h-4 w-4" />}
            label={`Deposit ${symbolA}`}
            value={sutils.displayCurrencyAmount(parsedAmountA)}
          />
          <TransactionDetailRow
            icon={<ArrowLineDownIcon className="h-4 w-4" />}
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
        setAmountA,
        setAmountB,
        handleNumericInput: handleAmountKeyDown,
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
