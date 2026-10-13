"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccount } from "@/hooks/use-account";
import { useTokenContext } from "@/modules/home/ui/components/swap-section/TokenContext";
import WalletConnect from "@/modules/home/ui/components/wallet-connect";
import { sutils } from "@nemi-fi/utils";
import { ArrowDown, Plus } from "lucide-react";
import React, { useCallback, useMemo, useRef } from "react";
import {
  RemoveLiquidityProvider,
  useRemoveLiquidityContext,
} from "./RemoveLiquidityContext";
import { Skeleton } from "@/components/ui/skeleton";

// LP Token Balance Display - Memoized
const LPTokenBalanceDisplay = React.memo(
  ({
    balance,
    showMaxButton = false,
    onMaxClick,
    poolSymbol,
    isLoading = false,
  }: {
    balance: string;
    poolSymbol: string;
    showMaxButton?: boolean;
    onMaxClick?: () => void;
    isLoading?: boolean;
  }) => {
    const account = useAccount();

    if (!account) return null;

    if (isLoading) {
      return <Skeleton className="h-5 w-32" />;
    }

    return (
      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500">
        <span>
          Balance: {balance} {poolSymbol}
        </span>
        {showMaxButton && onMaxClick && balance !== "0" && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs font-medium rounded-md border-gray-300 hover:bg-gray-100"
            onClick={onMaxClick}
            type="button"
            aria-label="Set maximum balance"
          >
            Max
          </Button>
        )}
      </div>
    );
  },
);

LPTokenBalanceDisplay.displayName = "LPTokenBalanceDisplay";

// Input field skeleton for loading state - Memoized
const InputFieldSkeleton = React.memo(() => (
  <div className="rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 bg-gray-50 dark:bg-zinc-900/60">
    <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
      <Skeleton className="h-9 sm:h-10 md:h-12 w-full" />
      <Skeleton className="h-8 sm:h-9 md:h-10 w-24 sm:w-28 md:w-32 rounded-full" />
    </div>
  </div>
));

InputFieldSkeleton.displayName = "InputFieldSkeleton";

// Token display button component - Memoized
const TokenButton = React.memo(
  ({
    token,
    onClick,
    disabled,
    showArrow = false,
  }: {
    token: any;
    onClick?: (e: React.MouseEvent) => void;
    disabled?: boolean;
    showArrow?: boolean;
  }) => (
    <Button
      variant="ghost"
      className="rounded-full h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4 bg-white dark:bg-zinc-800 border-0 shadow-sm text-xs sm:text-sm md:text-base font-medium flex items-center gap-1.5 sm:gap-2 md:gap-2.5 min-w-fit transition-colors hover:bg-gray-50 dark:hover:bg-zinc-700 active:bg-gray-100 dark:active:bg-zinc-700/80"
      onClick={onClick}
      type="button"
      disabled={disabled}
    >
      <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full overflow-hidden flex-shrink-0">
        {token?.logo}
      </div>
      <span className="truncate max-w-[50px] sm:max-w-none dark:text-white">
        {token?.symbol || "Select"}
      </span>
      {showArrow && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 ml-0.5 dark:text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      )}
    </Button>
  ),
);

TokenButton.displayName = "TokenButton";

// The main remove liquidity form component
const RemoveLiquidityForm = React.memo(
  ({ disableTokenSelection }: { disableTokenSelection?: boolean }) => {
    const {
      lpAmount,
      setLpAmount,
      handleNumericInput,
      openTokenModal,
      removeLiquidity,
      outputAmounts,
      lpTokenBalance,
      tokensPreselected,
      isLoading,
      error,
      handleMaxAmount,
    } = useRemoveLiquidityContext();

    const { selectedToken, selectedOutputToken, isTokensLoading } =
      useTokenContext();
    const account = useAccount();

    // Determine if we're in a loading state
    const isFormLoading = isLoading || isTokensLoading;

    // Input references for focus management
    const lpInputRef = useRef<HTMLInputElement>(null);

    // Handle input for LP amount
    const handleLpInput = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setLpAmount(e.target.value);
      },
      [setLpAmount],
    );

    // Set maximum LP balance
    const handleMaxLp = useCallback(() => {
      if (!isFormLoading && handleMaxAmount) {
        handleMaxAmount();
      }
    }, [isFormLoading, handleMaxAmount]);

    // Determine if remove liquidity button should be disabled
    const isRemoveLiquidityDisabled = useMemo(
      () =>
        !lpAmount ||
        lpAmount === "0" ||
        !outputAmounts ||
        !account ||
        isFormLoading ||
        !!error,
      [lpAmount, outputAmounts, account, isFormLoading, error],
    );

    // Get pool symbol for display
    const poolSymbol = useMemo(() => {
      if (!selectedToken?.symbol || !selectedOutputToken?.symbol) return "LP";
      return `${selectedToken.symbol}-${selectedOutputToken.symbol}`;
    }, [selectedToken?.symbol, selectedOutputToken?.symbol]);

    // Check if token selection should be disabled (from props or if tokens are preselected from URL)
    const shouldDisableTokenSelection = useMemo(
      () => disableTokenSelection || tokensPreselected,
      [disableTokenSelection, tokensPreselected],
    );

    // Handle token modal opening - memoized
    const handleOpenTokenAModal = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!shouldDisableTokenSelection) {
          openTokenModal("tokenA");
        }
      },
      [shouldDisableTokenSelection, openTokenModal],
    );

    const handleOpenTokenBModal = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!shouldDisableTokenSelection) {
          openTokenModal("tokenB");
        }
      },
      [shouldDisableTokenSelection, openTokenModal],
    );

    // Focus handler for input
    const handleFocusLpInput = useCallback(() => {
      lpInputRef.current?.focus();
    }, []);

    // Button label
    const buttonLabel = useMemo(() => {
      if (isFormLoading) return "Loading...";
      if (lpTokenBalance === "0") return "No Liquidity to Remove";
      if (!lpAmount || lpAmount === "0") return "Enter LP Amount";
      return "Remove Liquidity";
    }, [isFormLoading, lpTokenBalance, lpAmount]);

    // Memoized output amounts display values
    const outputAmountA = useMemo(
      () =>
        outputAmounts?.amount0
          ? sutils.formatCurrencyAmount(outputAmounts.amount0)
          : "0.00",
      [outputAmounts?.amount0],
    );

    const outputAmountB = useMemo(
      () =>
        outputAmounts?.amount1
          ? sutils.formatCurrencyAmount(outputAmounts.amount1)
          : "0.00",
      [outputAmounts?.amount1],
    );

    return (
      <>
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* LP Token Input */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Liquidity tokens
              </label>
              <LPTokenBalanceDisplay
                balance={lpTokenBalance}
                poolSymbol={poolSymbol}
                showMaxButton={true}
                onMaxClick={handleMaxLp}
                isLoading={isFormLoading}
              />
            </div>

            {isFormLoading ? (
              <InputFieldSkeleton />
            ) : (
              <div
                className="rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 bg-gray-50 dark:bg-zinc-900/60 hover:bg-gray-100 dark:hover:bg-zinc-800/80 transition-colors cursor-text"
                onClick={handleFocusLpInput}
              >
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                  <input
                    ref={lpInputRef}
                    placeholder="0.00"
                    type="text"
                    className="shadow-none flex-1 border-none text-xl sm:text-2xl md:text-3xl font-normal bg-transparent dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                    onKeyDown={handleNumericInput}
                    inputMode="decimal"
                    value={lpAmount}
                    onChange={handleLpInput}
                    aria-label="Enter amount of LP tokens to remove"
                    disabled={isFormLoading || lpTokenBalance === "0"}
                  />
                  <Button
                    variant="ghost"
                    className="rounded-full h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4 bg-white dark:bg-zinc-800 border-0 shadow-sm text-xs sm:text-sm md:text-base font-medium flex items-center gap-1.5 sm:gap-2 md:gap-2.5 min-w-fit transition-colors hover:bg-gray-50 dark:hover:bg-zinc-700 active:bg-gray-100 dark:active:bg-zinc-700/80"
                    type="button"
                  >
                    <span className="truncate max-w-[120px] sm:max-w-none dark:text-white">
                      {poolSymbol}
                    </span>
                  </Button>
                </div>
              </div>
            )}

            {lpTokenBalance === "0" && !isFormLoading && (
              <div className="mt-1 text-xs text-amber-600">
                You don't have any LP tokens for this pool
              </div>
            )}
          </div>

          {/* Arrow Down Icon */}
          <div className="flex justify-center my-1">
            <div className="bg-gray-100 dark:bg-zinc-800 rounded-full p-2">
              <ArrowDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
          </div>

          {/* Token A Output */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Token A
              </label>
            </div>

            {isFormLoading ? (
              <InputFieldSkeleton />
            ) : (
              <div className="rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 bg-gray-50 dark:bg-zinc-900/60 transition-colors">
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                  <input
                    placeholder="0.00"
                    type="text"
                    readOnly
                    className="shadow-none flex-1 border-none text-xl sm:text-2xl md:text-3xl font-normal bg-transparent dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                    value={outputAmountA}
                    aria-label="Amount of token A to receive"
                  />
                  <TokenButton
                    token={selectedToken}
                    onClick={handleOpenTokenAModal}
                    disabled={shouldDisableTokenSelection || isFormLoading}
                    showArrow={!shouldDisableTokenSelection}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Plus Icon */}
          <div className="flex justify-center my-1">
            <div className="bg-gray-100 dark:bg-zinc-800 rounded-full p-2">
              <Plus className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
          </div>

          {/* Token B Output */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Token B
              </label>
            </div>

            {isFormLoading ? (
              <InputFieldSkeleton />
            ) : (
              <div className="rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 bg-gray-50 dark:bg-zinc-900/60 transition-colors">
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                  <input
                    placeholder="0.00"
                    type="text"
                    readOnly
                    className="shadow-none flex-1 border-none text-xl sm:text-2xl md:text-3xl font-normal bg-transparent dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                    value={outputAmountB}
                    aria-label="Amount of token B to receive"
                  />
                  <TokenButton
                    token={selectedOutputToken}
                    onClick={handleOpenTokenBModal}
                    disabled={shouldDisableTokenSelection || isFormLoading}
                    showArrow={!shouldDisableTokenSelection}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-6">
            {!account ? (
              <div>
                <WalletConnect fullWidth />
              </div>
            ) : (
              <Button
                className="w-full h-12 sm:h-14"
                variant="default"
                onClick={removeLiquidity}
                disabled={isRemoveLiquidityDisabled}
              >
                {buttonLabel}
              </Button>
            )}
          </div>
        </div>
      </>
    );
  },
);

RemoveLiquidityForm.displayName = "RemoveLiquidityForm";

// The main component that wraps RemoveLiquidityForm with provider
export const RemoveLiquiditySection = React.memo(
  ({ disableTokenSelection }: { disableTokenSelection?: boolean }) => {
    return (
      <div className="w-full max-w-[95%] md:max-w-lg mx-auto">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-center text-xl font-semibold leading-tight tracking-tight md:text-2xl">
              Remove Liquidity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RemoveLiquidityProvider>
              <RemoveLiquidityForm
                disableTokenSelection={disableTokenSelection}
              />
            </RemoveLiquidityProvider>
          </CardContent>
        </Card>
      </div>
    );
  },
);

RemoveLiquiditySection.displayName = "RemoveLiquiditySection";
