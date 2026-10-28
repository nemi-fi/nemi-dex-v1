"use client";

import { TransactionDetailRow, TxModal } from "#/components/TxModal.js";
import { useAccount } from "#/hooks/use-account.js";
import { handleAmountKeyDown } from "#/lib/amount-input.js";
import { modals } from "#/lib/modal.js";
import { lib } from "#/lib/sdk.js";
import { toast } from "#/lib/toast.js";
import { useTokenContext } from "#/modules/home/ui/components/swap-section/TokenContext.js";
import type { interfaceSdk } from "@nemi-fi/interface-sdk";
import { sutils } from "@nemi-fi/utils";
import type { L2Token, Pool } from "@nemi-fi/v1-sdk";
import type { CurrencyAmount } from "@uniswap/sdk-core";
import { ArrowUpFromLine } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router";

type OutputAmounts = {
  amount0: CurrencyAmount<L2Token>;
  amount1: CurrencyAmount<L2Token>;
};

type PoolData = {
  pool: Pool | null;
  position: interfaceSdk.PoolPosition | null;
  /** The user's LP balance, formatted for the input field ("0" when none) */
  lpTokenBalance: string;
};

const NO_POOL: PoolData = { pool: null, position: null, lpTokenBalance: "0" };

interface RemoveLiquidityContextProps {
  lpAmount: string;
  setLpAmount: (value: string) => void;
  handleNumericInput: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  pool: Pool | null;
  removeLiquidity: () => Promise<void>;
  outputAmounts: OutputAmounts | null;
  lpTokenBalance: string;
  isLoading: boolean;
  error: string | null;
  handleMaxAmount: () => void;
}

const RemoveLiquidityContext = createContext<
  RemoveLiquidityContextProps | undefined
>(undefined);

export const useRemoveLiquidityContext = () => {
  const context = useContext(RemoveLiquidityContext);
  if (!context) {
    throw new Error(
      "useRemoveLiquidityContext must be used within a RemoveLiquidityProvider",
    );
  }
  return context;
};

/** Loads the pool for a token pair and, when connected, the user's position in it. */
async function loadPoolData(
  tokenA: L2Token,
  tokenB: L2Token,
  account: interfaceSdk.Account | undefined,
): Promise<PoolData> {
  let pool: Pool | null | undefined;
  try {
    pool = await lib.amm.getPoolWithReserves(tokenA, tokenB);
  } catch (err) {
    // Treated like a missing pool, as before
    console.error("Error loading pool:", err);
  }
  if (!pool) {
    return NO_POOL;
  }

  let position: interfaceSdk.PoolPosition | null = null;
  if (account) {
    try {
      position = await lib.amm.getPositionInfo(pool, account);
    } catch (err) {
      console.warn("Error getting position info:", err);
    }
  }

  return {
    pool,
    position,
    lpTokenBalance: position?.lpBalance
      ? sutils.formatLiquidityBalance(position.lpBalance)
      : "0",
  };
}

/** Parses an LP amount, or `undefined` when it isn't a valid amount. */
function parseLpAmount(value: string) {
  try {
    return sutils.parseLiquidityBalance(value);
  } catch {
    return undefined;
  }
}

function getOutputAmounts(
  pool: Pool | null,
  position: interfaceSdk.PoolPosition | null,
  lpAmount: ReturnType<typeof parseLpAmount>,
): OutputAmounts | null {
  if (!pool || !position?.lpTotalSupply || !lpAmount?.greaterThan(0)) {
    return null;
  }
  try {
    return {
      amount0: pool.getLiquidityValue(
        pool.token0,
        position.lpTotalSupply,
        lpAmount,
      ),
      amount1: pool.getLiquidityValue(
        pool.token1,
        position.lpTotalSupply,
        lpAmount,
      ),
    };
  } catch (error) {
    console.error("Error calculating output amounts:", error);
    return null;
  }
}

export const RemoveLiquidityProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const navigate = useNavigate();
  const { selectedToken, selectedOutputToken, isTokensLoading } =
    useTokenContext();
  const account = useAccount();

  const [lpAmount, setLpAmountState] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [{ pool, position, lpTokenBalance }, setPoolData] =
    useState<PoolData>(NO_POOL);
  const [isLoading, setIsLoading] = useState(true);

  const tokenA = selectedToken?.l2Token?.address
    ? selectedToken.l2Token
    : undefined;
  const tokenB = selectedOutputToken?.l2Token?.address
    ? selectedOutputToken.l2Token
    : undefined;

  // Fetch pool and position when the tokens or account change
  useEffect(() => {
    if (isTokensLoading) {
      setIsLoading(true);
      return;
    }
    if (!tokenA || !tokenB) {
      setPoolData(NO_POOL);
      return;
    }

    // Drop the result when the tokens or account changed while it was loading.
    let isStale = false;
    setIsLoading(true);
    setError(null);

    loadPoolData(tokenA, tokenB, account)
      .then((data) => {
        if (isStale) return;
        setPoolData(data);
        if (!data.pool) setLpAmountState("");
      })
      .catch((err) => {
        console.error("Error fetching pool and position:", err);
        if (isStale) return;
        setPoolData(NO_POOL);
        setLpAmountState("");
        setError("Failed to fetch pool information");
      })
      .finally(() => {
        if (!isStale) setIsLoading(false);
      });

    return () => {
      isStale = true;
    };
  }, [tokenA, tokenB, account, isTokensLoading]);

  const setLpAmount = useCallback(
    (value: string) => {
      const amount = value ? parseLpAmount(value) : undefined;
      if (value && !amount) {
        setLpAmountState(value);
        setError("Invalid amount");
        return;
      }
      setError(null);
      // Can't remove more than you have: cap the input at the balance
      const balance = parseLpAmount(lpTokenBalance);
      setLpAmountState(
        amount && balance && amount.greaterThan(balance)
          ? lpTokenBalance
          : value,
      );
    },
    [lpTokenBalance],
  );

  const handleMaxAmount = useCallback(() => {
    if (lpTokenBalance === "0") {
      setLpAmountState("");
      setError("You don't have any LP tokens to remove");
      return;
    }
    setLpAmountState(lpTokenBalance);
    setError(null);
  }, [lpTokenBalance]);

  // What the user gets back for the entered LP amount
  const parsedLpAmount = lpAmount ? parseLpAmount(lpAmount) : undefined;
  const outputAmounts = getOutputAmounts(pool, position, parsedLpAmount);

  const removeLiquidity = useCallback(async () => {
    if (!parsedLpAmount || !outputAmounts || !pool || !account) {
      setError("Missing required fields for removing liquidity");
      return;
    }

    const { amount0, amount1 } = outputAmounts;
    if (amount0.equalTo(0) || amount1.equalTo(0)) {
      setError("Tried to remove insufficient liquidity");
      return;
    }

    const refreshAfterRemove = async () => {
      setLpAmountState("");
      if (!tokenA || !tokenB) return;
      const data = await loadPoolData(tokenA, tokenB, account);
      setPoolData(data);
      if (data.lpTokenBalance === "0") {
        toast.success("All liquidity removed. Redirecting to pools...");
        setTimeout(() => navigate("/pool"), 1500);
      }
    };

    // Run the tx through the shared TxModal so the flow (review -> proving -> sent, with a
    // copyable transaction hash) matches swap.
    modals.show(TxModal, {
      details: (
        <>
          <TransactionDetailRow
            icon={<ArrowUpFromLine className="h-4 w-4" />}
            label="You receive"
            value={`~${sutils.displayCurrencyAmount(amount0)}`}
          />
          <TransactionDetailRow
            icon={<ArrowUpFromLine className="h-4 w-4" />}
            label="You receive"
            value={`~${sutils.displayCurrencyAmount(amount1)}`}
          />
        </>
      ),
      sendTx: async () => {
        const tx = await lib.amm.removeLiquidity({
          amountLp: parsedLpAmount,
          amountA: amount0,
          amountB: amount1,
          account,
        });
        // The SDK's transaction tracker already toasts the confirm/fail lifecycle of this tx;
        // here we only run the local side effects once it confirms. Errors are surfaced by that
        // toast, so we don't catch (and swallow) them here.
        void tx.wait().then(refreshAfterRemove);
        return tx;
      },
    });
  }, [parsedLpAmount, outputAmounts, pool, account, tokenA, tokenB, navigate]);

  return (
    <RemoveLiquidityContext.Provider
      value={{
        lpAmount,
        setLpAmount,
        handleNumericInput: handleAmountKeyDown,
        pool,
        removeLiquidity,
        outputAmounts,
        lpTokenBalance,
        isLoading,
        error,
        handleMaxAmount,
      }}
    >
      {children}
    </RemoveLiquidityContext.Provider>
  );
};
