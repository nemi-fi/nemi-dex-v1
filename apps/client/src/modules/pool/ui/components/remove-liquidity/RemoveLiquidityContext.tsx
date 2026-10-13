"use client";

import { useAccount } from "@/hooks/use-account";
import { lib } from "@/lib/sdk";
import { TransactionDetailRow, TxModal } from "@/components/TxModal";
import { modals } from "@/lib/modal";
import { ArrowUpFromLine } from "lucide-react";
import { useTokenContext } from "@/modules/home/ui/components/swap-section/TokenContext";
import { sutils } from "@nemi-fi/utils";
import { useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { calculatePositionValue } from "../pool-section/PoolCard";

// Debounce utility function
const debounce = <F extends (...args: any[]) => any>(func: F, wait: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return ((...args: Parameters<F>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as (...args: Parameters<F>) => ReturnType<F>;
};

// Modal selection state management
const useTokenModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTokenModal, setSelectedTokenModal] = useState<
    "input" | "output"
  >("input");

  return {
    isModalOpen,
    setIsModalOpen,
    selectedTokenModal,
    setSelectedTokenModal,
  };
};

interface RemoveLiquidityContextProps {
  lpAmount: string;
  setLpAmount: (value: string) => void;
  handleNumericInput: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  openTokenModal: (inputType: "tokenA" | "tokenB") => void;
  isTokenModalOpen: boolean;
  closeTokenModal: () => void;
  selectedTokenModalType: "input" | "output";
  pool: any;
  removeLiquidity: () => Promise<void>;
  outputAmounts: {
    amount0: any;
    amount1: any;
  } | null;
  lpTokenBalance: string;
  lpTokenBalanceUSD: string;
  tokensPreselected: boolean;
  isLoading: boolean;
  error: string | null;
  handleMaxAmount: () => void;
  isMaxAmount: boolean;
  validateAmount: (value: string) => boolean;
  notification: {
    type: "success" | "error" | "info" | null;
    message: string;
  };
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

export const RemoveLiquidityProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const router = useRouter();
  const { selectedToken, selectedOutputToken, isTokensLoading } =
    useTokenContext();
  const {
    isModalOpen,
    setIsModalOpen,
    selectedTokenModal,
    setSelectedTokenModal,
  } = useTokenModal();

  const account = useAccount();

  // Consolidated state with related values
  const [formState, setFormState] = useState({
    lpAmount: "",
    isMaxAmount: false,
    error: null as string | null,
  });

  // Pool and position state
  const [poolData, setPoolData] = useState({
    pool: null as any,
    position: null as any,
    lpTokenBalance: "0",
    lpTokenBalanceUSD: "0",
  });

  // UI state
  const [uiState, setUiState] = useState({
    tokensPreselected: false,
    isLoading: false,
  });

  const [outputAmounts, setOutputAmounts] = useState<{
    amount0: any;
    amount1: any;
  } | null>(null);

  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({
    type: null,
    message: "",
  });

  // Extract values from consolidated state for easier reference
  const { lpAmount, isMaxAmount, error } = formState;
  const { pool, position, lpTokenBalance, lpTokenBalanceUSD } = poolData;
  const { tokensPreselected, isLoading } = uiState;

  // Clear notification after a timeout - memoized to avoid recreating the timeout
  useEffect(() => {
    if (notification.type) {
      const timer = setTimeout(() => {
        setNotification({ type: null, message: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Determine if tokens are preselected from URL parameters - memoized
  useEffect(() => {
    if (
      !isTokensLoading &&
      selectedToken?.l2Token?.address &&
      selectedOutputToken?.l2Token?.address
    ) {
      setUiState((prev) => ({
        ...prev,
        tokensPreselected: true,
      }));
    }
  }, [
    isTokensLoading,
    selectedToken?.l2Token?.address,
    selectedOutputToken?.l2Token?.address,
  ]);

  // Memoized function to get pool with position
  const getPoolWithPosition = useCallback(
    async (tokenA: any, tokenB: any) => {
      if (!tokenA?.address || !tokenB?.address) {
        console.log("Missing token addresses for pool lookup");
        return null;
      }

      try {
        // Get pool with reserves
        const poolWithReserves = await lib.amm.getPoolWithReserves(
          tokenA,
          tokenB,
        );

        if (!poolWithReserves) {
          console.log("No pool found for selected tokens");
          return null;
        }

        // If we have an account, get position info
        if (account) {
          try {
            const positionInfo = await lib.amm.getPositionInfo(
              poolWithReserves,
              account,
            );
            return { pool: poolWithReserves, position: positionInfo };
          } catch (err) {
            console.warn("Error getting position info:", err);
            return { pool: poolWithReserves, position: null };
          }
        }

        // No account, return pool without position
        return { pool: poolWithReserves, position: null };
      } catch (err) {
        console.error("Error processing pool:", err);
        return null;
      }
    },
    [account],
  );

  // Fetch pool and position when tokens change - optimized with better dependency tracking
  useEffect(() => {
    // Skip fetching if tokens are still loading
    if (isTokensLoading) {
      setUiState((prev) => ({ ...prev, isLoading: true }));
      return;
    }

    const fetchPoolAndPosition = async () => {
      if (
        !selectedToken?.l2Token?.address ||
        !selectedOutputToken?.l2Token?.address
      ) {
        setPoolData({
          pool: null,
          position: null,
          lpTokenBalance: "0",
          lpTokenBalanceUSD: "0",
        });
        return;
      }

      setUiState((prev) => ({ ...prev, isLoading: true }));
      setFormState((prev) => ({ ...prev, error: null }));

      try {
        console.log("Fetching pool for tokens:", {
          tokenA: selectedToken.symbol,
          tokenB: selectedOutputToken.symbol,
        });

        const result = await getPoolWithPosition(
          selectedToken.l2Token,
          selectedOutputToken.l2Token,
        );

        if (result) {
          const { pool: fetchedPool, position: fetchedPosition } = result;

          let newBalance = "0";
          let newBalanceUSD = "0";

          if (fetchedPosition?.lpBalance) {
            newBalance = sutils.formatLiquidityBalance(
              fetchedPosition.lpBalance,
            );

            // Calculate USD value
            const usdValue = calculatePositionValue(fetchedPosition);
            newBalanceUSD = usdValue.toString();

            console.log("Found position with LP balance:", newBalance);
          } else {
            console.log("No LP balance found for this position");
          }

          // Update pool data in a single state update
          setPoolData({
            pool: fetchedPool,
            position: fetchedPosition,
            lpTokenBalance: newBalance,
            lpTokenBalanceUSD: newBalanceUSD,
          });
        } else {
          console.log("No pool or position found for selected tokens");
          // Reset all pool-related state in a single update
          setPoolData({
            pool: null,
            position: null,
            lpTokenBalance: "0",
            lpTokenBalanceUSD: "0",
          });

          // Reset the form when no pool is found
          setFormState((prev) => ({
            ...prev,
            lpAmount: "",
          }));
        }
      } catch (error) {
        console.error("Error fetching pool and position:", error);
        // Reset all state in a single update on error
        setPoolData({
          pool: null,
          position: null,
          lpTokenBalance: "0",
          lpTokenBalanceUSD: "0",
        });

        setFormState((prev) => ({
          ...prev,
          lpAmount: "",
          error: "Failed to fetch pool information",
        }));
      } finally {
        setUiState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    fetchPoolAndPosition();
  }, [
    selectedToken?.l2Token?.address,
    selectedOutputToken?.l2Token?.address,
    account,
    getPoolWithPosition,
    isTokensLoading,
  ]);

  // Separate effect to validate lpAmount against the balance
  useEffect(() => {
    if (lpAmount && lpTokenBalance) {
      // If user has an input amount that exceeds the balance, reset it
      if (parseFloat(lpAmount) > parseFloat(lpTokenBalance)) {
        setFormState((prev) => ({
          ...prev,
          lpAmount: lpTokenBalance,
          isMaxAmount: true,
        }));
      }
    }
  }, [lpAmount, lpTokenBalance]);

  // Validation function for LP amount - memoized
  const validateAmount = useCallback(
    (value: string) => {
      if (!value || !lpTokenBalance) return true;

      try {
        const parsedValue = parseFloat(value);
        const maxValue = parseFloat(lpTokenBalance);

        // Validate that amount is positive and not greater than balance
        return (
          !isNaN(parsedValue) && parsedValue > 0 && parsedValue <= maxValue
        );
      } catch (error) {
        return false;
      }
    },
    [lpTokenBalance],
  );

  // Debounced update LP amount - reduces frequent state updates
  const debouncedUpdateLpAmount = useMemo(
    () =>
      debounce((value: string) => {
        // Don't allow entering any value when balance is 0
        if (lpTokenBalance === "0") {
          setFormState((prev) => ({ ...prev, lpAmount: "", error: null }));
          return;
        }

        // Set whether this is the max amount
        const isMax = value === lpTokenBalance;

        // Validate the input
        let errorMsg = null;
        if (value && !validateAmount(value)) {
          errorMsg = `Amount exceeds available balance of ${lpTokenBalance}`;
        }

        // Update form state in a single update
        setFormState({
          lpAmount: value,
          isMaxAmount: isMax,
          error: errorMsg,
        });
      }, 100),
    [lpTokenBalance, validateAmount],
  );

  // Immediate update function that calls the debounced version
  const updateLpAmount = useCallback(
    (value: string) => {
      // Always update the input value immediately for responsiveness
      setFormState((prev) => ({ ...prev, lpAmount: value }));
      // Then use the debounced function for validation and additional updates
      debouncedUpdateLpAmount(value);
    },
    [debouncedUpdateLpAmount],
  );

  // Handle numeric input validation - memoized to avoid recreation
  const handleNumericInput = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow numbers, backspace, delete, tab, decimal point
      if (
        !/^\d$/.test(e.key) &&
        e.key !== "Backspace" &&
        e.key !== "Delete" &&
        e.key !== "Tab" &&
        e.key !== "." &&
        e.key !== "ArrowLeft" &&
        e.key !== "ArrowRight"
      ) {
        e.preventDefault();
      }

      // Prevent multiple decimal points
      if (
        e.key === "." &&
        (e.currentTarget.value.includes(".") || e.currentTarget.value === "")
      ) {
        e.preventDefault();
      }

      // Prevent entering any value when balance is 0
      if (
        lpTokenBalance === "0" &&
        !/^(Backspace|Delete|Tab|ArrowLeft|ArrowRight)$/.test(e.key)
      ) {
        e.preventDefault();
      }
    },
    [lpTokenBalance],
  );

  // Token modal handlers - memoized
  const openTokenModal = useCallback(
    (inputType: "tokenA" | "tokenB") => {
      // Don't open modal if tokens are preselected from URL
      if (tokensPreselected) return;

      setSelectedTokenModal(inputType === "tokenA" ? "input" : "output");
      setIsModalOpen(true);
    },
    [tokensPreselected, setSelectedTokenModal, setIsModalOpen],
  );

  const closeTokenModal = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  // Calculate output amounts when LP amount changes - optimized with proper dependencies
  useEffect(() => {
    if (!lpAmount || !pool || !position?.lpTotalSupply) {
      setOutputAmounts(null);
      return;
    }

    try {
      // Don't calculate if amount is invalid
      if (!validateAmount(lpAmount)) {
        setOutputAmounts(null);
        return;
      }

      // Parse LP amount
      const parsedLpAmount = sutils.parseLiquidityBalance(lpAmount);

      // Calculate output amounts
      const amount0 = pool.getLiquidityValue(
        pool.token0,
        position.lpTotalSupply,
        parsedLpAmount,
      );
      const amount1 = pool.getLiquidityValue(
        pool.token1,
        position.lpTotalSupply,
        parsedLpAmount,
      );

      setOutputAmounts({
        amount0,
        amount1,
      });

      console.log("Calculated output amounts:", {
        amount0: sutils.formatCurrencyAmount(amount0),
        amount1: sutils.formatCurrencyAmount(amount1),
      });
    } catch (error) {
      console.error("Error calculating output amounts:", error);
      setOutputAmounts(null);
    }
  }, [lpAmount, pool, position?.lpTotalSupply, validateAmount]);

  // Handle max button - memoized
  const handleMaxAmount = useCallback(() => {
    if (position?.lpBalance) {
      const maxBalance = sutils.formatLiquidityBalance(position.lpBalance);
      if (maxBalance === "0") {
        setFormState({
          lpAmount: "",
          isMaxAmount: false,
          error: "You don't have any LP tokens to remove",
        });
        return;
      }

      setFormState({
        lpAmount: maxBalance,
        isMaxAmount: true,
        error: null,
      });
    } else {
      setFormState({
        lpAmount: "",
        isMaxAmount: false,
        error: "No liquidity position found",
      });
    }
  }, [position?.lpBalance]);

  // Check if balance is zero and redirect if needed - memoized
  const checkBalanceAndRedirect = useCallback(
    (balance: string) => {
      if (balance === "0") {
        // Show notification that we're redirecting
        setNotification({
          type: "info",
          message: "All liquidity removed. Redirecting to pools page...",
        });

        // Add a small delay before redirecting
        setTimeout(() => {
          router.push("/pools");
        }, 1500);
      }
    },
    [router],
  );

  // Remove liquidity function - memoized
  const removeLiquidity = useCallback(async () => {
    if (!lpAmount || !outputAmounts || !pool || !account) {
      setFormState((prev) => ({
        ...prev,
        error: "Missing required fields for removing liquidity",
      }));
      return;
    }

    // Extra validation before proceeding
    if (!validateAmount(lpAmount)) {
      setFormState((prev) => ({
        ...prev,
        error: `Cannot remove more than your balance of ${lpTokenBalance}`,
      }));
      return;
    }

    const parsedLpAmount = sutils.parseLiquidityBalance(lpAmount);
    const { amount0, amount1 } = outputAmounts;

    if (amount0.equalTo(0) || amount1.equalTo(0)) {
      setFormState((prev) => ({
        ...prev,
        error: "Tried to remove insufficient liquidity",
      }));
      return;
    }

    const description = `${sutils.displayLiquidityBalance(parsedLpAmount)} LP -> ~${sutils.displayCurrencyAmount(
      amount0,
    )} & ~${sutils.displayCurrencyAmount(amount1)}`;

    const refreshAfterRemove = async () => {
      setNotification({
        type: "success",
        message: `Successfully removed ${description}!`,
      });
      setFormState({ lpAmount: "", isMaxAmount: false, error: null });
      setOutputAmounts(null);

      const result = await getPoolWithPosition(
        selectedToken?.l2Token,
        selectedOutputToken?.l2Token,
      );
      if (result) {
        const { pool: updatedPool, position: updatedPosition } = result;
        let newBalance = "0";
        let newBalanceUSD = "0";
        if (updatedPosition?.lpBalance) {
          newBalance = sutils.formatLiquidityBalance(updatedPosition.lpBalance);
          newBalanceUSD = calculatePositionValue(updatedPosition).toString();
        }
        setPoolData({
          pool: updatedPool,
          position: updatedPosition,
          lpTokenBalance: newBalance,
          lpTokenBalanceUSD: newBalanceUSD,
        });
        checkBalanceAndRedirect(newBalance);
      } else {
        setPoolData({
          pool: null,
          position: null,
          lpTokenBalance: "0",
          lpTokenBalanceUSD: "0",
        });
        checkBalanceAndRedirect("0");
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
  }, [
    lpAmount,
    outputAmounts,
    pool,
    account,
    lpTokenBalance,
    validateAmount,
    getPoolWithPosition,
    selectedToken?.l2Token,
    selectedOutputToken?.l2Token,
    checkBalanceAndRedirect,
  ]);

  // Memoized context value to prevent unnecessary renders in consumers
  const contextValue = useMemo(
    () => ({
      lpAmount,
      setLpAmount: updateLpAmount,
      handleNumericInput,
      openTokenModal,
      isTokenModalOpen: isModalOpen,
      closeTokenModal,
      selectedTokenModalType: selectedTokenModal,
      pool,
      removeLiquidity,
      outputAmounts,
      lpTokenBalance,
      lpTokenBalanceUSD,
      tokensPreselected,
      isLoading,
      error,
      handleMaxAmount,
      isMaxAmount,
      validateAmount,
      notification,
    }),
    [
      lpAmount,
      updateLpAmount,
      handleNumericInput,
      openTokenModal,
      isModalOpen,
      closeTokenModal,
      selectedTokenModal,
      pool,
      removeLiquidity,
      outputAmounts,
      lpTokenBalance,
      lpTokenBalanceUSD,
      tokensPreselected,
      isLoading,
      error,
      handleMaxAmount,
      isMaxAmount,
      validateAmount,
      notification,
    ],
  );

  return (
    <RemoveLiquidityContext.Provider value={contextValue}>
      {children}
    </RemoveLiquidityContext.Provider>
  );
};
