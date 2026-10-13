"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccount } from "@/hooks/use-account";
import { useBalance } from "@/lib/queries";
import { TokenBalanceDisplay } from "@/modules/home/ui/components/swap-section";
import { useTokenContext } from "@/modules/home/ui/components/swap-section/TokenContext";
import { TokenSelector } from "@/modules/home/ui/components/swap-section/TokenSelector";
import WalletConnect from "@/modules/home/ui/components/wallet-connect";
import { sutils } from "@nemi-fi/utils";
import { Plus } from "lucide-react";
import Link from "next/link";
import React, { useRef } from "react";
import {
  AddLiquidityProvider,
  useAddLiquidityContext,
} from "./AddLiquidityContext";

// Add new Loading Skeleton component for input fields
const TokenInputSkeleton = () => (
  <div className="rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 bg-gray-50 dark:bg-zinc-900/60">
    <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
      <Skeleton className="h-9 sm:h-10 md:h-12 w-full" />
      <Skeleton className="h-8 sm:h-9 md:h-10 w-24 sm:w-28 md:w-32 rounded-full" />
    </div>
  </div>
);

// The main add liquidity form component
const AddLiquidityForm = ({
  disableTokenSelection,
}: {
  disableTokenSelection?: boolean;
}) => {
  const {
    amountA,
    amountB,
    setAmountA,
    setAmountB,
    handleNumericInput,
    isCalculating,
    openTokenModal,
    isTokenModalOpen,
    closeTokenModal,
    selectedTokenModalType,
    addLiquidity,
    isPoolExisting,
    quoteData,
    allowBothInputs,
    shouldAutoFill,
    isPoolLoading,
  } = useAddLiquidityContext();

  const { selectedToken, selectedOutputToken, isTokensLoading } =
    useTokenContext();
  const account = useAccount();

  // Get balances
  const tokenABalance = useBalance(account, selectedToken?.l2Token);
  const tokenBBalance = useBalance(account, selectedOutputToken?.l2Token);

  // Input references for focus management
  const tokenAInputRef = useRef<HTMLInputElement>(null);
  const tokenBInputRef = useRef<HTMLInputElement>(null);

  // Handle input for token A and update
  const handleTokenAInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountA(e.target.value);
  };

  // Handle input for token B (only enabled if manual input is allowed)
  const handleTokenBInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountB(e.target.value);
  };

  // Set maximum balance for token A
  const handleMaxA = () => {
    if (tokenABalance.data && selectedToken?.l2Token) {
      setAmountA(sutils.formatCurrencyAmount(tokenABalance.data));
    }
  };

  // Set maximum balance for token B
  const handleMaxB = () => {
    if (tokenBBalance.data && selectedOutputToken?.l2Token) {
      setAmountB(sutils.formatCurrencyAmount(tokenBBalance.data));
    }
  };

  // Determine if add liquidity button should be disabled
  const isAddLiquidityDisabled =
    !amountA ||
    !amountB ||
    amountA === "0" ||
    amountB === "0" ||
    !account ||
    isPoolLoading ||
    isTokensLoading ||
    !selectedToken?.l2Token?.address ||
    !selectedOutputToken?.l2Token?.address;

  // Check if we're in a loading state
  const isLoading = isPoolLoading || isTokensLoading;

  // Get pool status text
  const getPoolStatusMessage = () => {
    if (isTokensLoading) {
      return {
        title: "Loading tokens...",
        description: "Please wait while we fetch the token data...",
        type: "loading",
      };
    }

    if (!selectedToken?.symbol || !selectedOutputToken?.symbol) return null;

    if (isPoolLoading) {
      return {
        title: `Checking ${selectedToken.symbol}-${selectedOutputToken.symbol} pool status`,
        description: "Please wait while we fetch the pool data...",
        type: "loading",
      };
    } else if (isPoolExisting === false) {
      return {
        title: `Creating a new ${selectedToken.symbol}-${selectedOutputToken.symbol} pool`,
        description: "You'll be the first to add liquidity to this pool.",
        type: "new",
      };
    } else if (isPoolExisting) {
      if (shouldAutoFill) {
        return {
          title: `${selectedToken.symbol}-${selectedOutputToken.symbol} pool exists`,
          description:
            "Amount B is automatically calculated based on the pool's current ratio.",
          type: "existing",
        };
      } else {
        return {
          title: `${selectedToken.symbol}-${selectedOutputToken.symbol} pool exists but is empty`,
          description: "You can set your own ratio for this pool.",
          type: "empty",
        };
      }
    }

    return null;
  };

  const poolStatus = getPoolStatusMessage();

  return (
    <>
      <div className="space-y-4">
        {/* Pool status notice */}
        {poolStatus && (
          <div
            className={`p-3 rounded-lg text-sm border ${
              poolStatus.type === "loading"
                ? "bg-gray-50 text-gray-700 border-gray-200"
                : poolStatus.type === "new"
                  ? "bg-blue-50 text-blue-700 border-blue-100"
                  : "bg-green-50 text-green-700 border-green-100"
            }`}
          >
            <div className="font-medium mb-1 flex items-center">
              {poolStatus.type === "loading" && (
                <Skeleton className="h-4 w-4 rounded-full mr-2 animate-pulse" />
              )}
              {poolStatus.title}
            </div>
            <p>{poolStatus.description}</p>
          </div>
        )}

        {/* Token A Input */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-sm text-gray-600 dark:text-gray-400">
              Token A
            </label>
            {account && !isLoading && (
              <TokenBalanceDisplay
                token={selectedToken.l2Token}
                showMintButton
                onMaxClick={handleMaxA}
              />
            )}
            {account && isLoading && <Skeleton className="h-5 w-32" />}
          </div>

          {isLoading ? (
            <TokenInputSkeleton />
          ) : (
            <div
              className="rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 bg-gray-50 dark:bg-zinc-900/60 hover:bg-gray-100 dark:hover:bg-zinc-800/80 transition-colors cursor-text"
              onClick={() => tokenAInputRef.current?.focus()}
            >
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                <input
                  ref={tokenAInputRef}
                  placeholder="0.00"
                  type="text"
                  className="shadow-none flex-1 border-none text-xl sm:text-2xl md:text-3xl font-normal bg-transparent dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                  onKeyDown={handleNumericInput}
                  inputMode="decimal"
                  value={amountA}
                  onChange={handleTokenAInput}
                  aria-label="Enter amount for token A"
                  disabled={isLoading}
                />
                <Button
                  variant="ghost"
                  className="rounded-full h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4 bg-white dark:bg-zinc-800 border-0 shadow-sm text-xs sm:text-sm md:text-base font-medium flex items-center gap-1.5 sm:gap-2 md:gap-2.5 min-w-fit transition-colors hover:bg-gray-50 dark:hover:bg-zinc-700 active:bg-gray-100 dark:active:bg-zinc-700/80"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!disableTokenSelection) {
                      openTokenModal("tokenA");
                    }
                  }}
                  type="button"
                  disabled={isLoading || disableTokenSelection}
                >
                  <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full overflow-hidden flex-shrink-0">
                    {selectedToken?.logo}
                  </div>
                  <span className="truncate max-w-[50px] sm:max-w-none dark:text-white">
                    {selectedToken?.symbol || "Select"}
                  </span>
                  {!disableTokenSelection && (
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
              </div>
            </div>
          )}
        </div>

        {/* Middle icon */}
        <div className="flex justify-center py-1">
          <div className="bg-gray-100 dark:bg-zinc-800 p-1.5 rounded-full">
            <Plus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>
        </div>

        {/* Token B Input */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-sm text-gray-600 dark:text-gray-400">
              Token B
            </label>
            {account && !isLoading && (
              <TokenBalanceDisplay
                token={selectedOutputToken.l2Token}
                showMintButton
                onMaxClick={handleMaxB}
              />
            )}
            {account && isLoading && <Skeleton className="h-5 w-32" />}
          </div>

          {isLoading ? (
            <TokenInputSkeleton />
          ) : (
            <div
              className={`rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 bg-gray-50 dark:bg-zinc-900/60 hover:bg-gray-100 dark:hover:bg-zinc-800/80 transition-colors ${allowBothInputs ? "cursor-text" : isCalculating ? "cursor-wait opacity-75" : "cursor-not-allowed opacity-75"}`}
              onClick={() => allowBothInputs && tokenBInputRef.current?.focus()}
            >
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                <input
                  ref={tokenBInputRef}
                  placeholder="0.00"
                  type="text"
                  className="shadow-none flex-1 border-none text-xl sm:text-2xl md:text-3xl font-normal bg-transparent dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                  onKeyDown={handleNumericInput}
                  inputMode="decimal"
                  value={amountB}
                  onChange={handleTokenBInput}
                  aria-label="Enter amount for token B"
                  disabled={!allowBothInputs || isLoading}
                />
                <Button
                  variant="ghost"
                  className="rounded-full h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4 bg-white dark:bg-zinc-800 border-0 shadow-sm text-xs sm:text-sm md:text-base font-medium flex items-center gap-1.5 sm:gap-2 md:gap-2.5 min-w-fit transition-colors hover:bg-gray-50 dark:hover:bg-zinc-700 active:bg-gray-100 dark:active:bg-zinc-700/80"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!disableTokenSelection) {
                      openTokenModal("tokenB");
                    }
                  }}
                  type="button"
                  disabled={isLoading || disableTokenSelection}
                >
                  <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full overflow-hidden flex-shrink-0">
                    {selectedOutputToken?.logo}
                  </div>
                  <span className="truncate max-w-[50px] sm:max-w-none dark:text-white">
                    {selectedOutputToken?.symbol || "Select"}
                  </span>
                  {!disableTokenSelection && (
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
              </div>
            </div>
          )}
        </div>

        {/* {quoteData && !isPoolLoading && (
          <div className="p-3 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/60 text-sm">
            <div className="font-medium mb-2">Estimated Pool Details</div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Ratio{" "}
                  <span className="text-xs">
                    ({selectedToken?.symbol}/{selectedOutputToken?.symbol})
                  </span>
                </span>
                <span className="font-medium">{quoteData?.ratio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Pool Share
                </span>
                <span className="font-medium">{quoteData?.sharePercent}</span>
              </div>
            </div>
          </div>
        )} */}

        {/* Action Button */}
        {!account && (
          <div>
            <WalletConnect fullWidth />
          </div>
        )}

        {account && (
          <div>
            <Button
              className="w-full h-12 sm:h-14"
              variant="default"
              disabled={isAddLiquidityDisabled}
              onClick={addLiquidity}
            >
              {isTokensLoading
                ? "Loading Tokens..."
                : isPoolLoading
                  ? "Loading Pool Data..."
                  : !selectedToken?.symbol || !selectedOutputToken?.symbol
                    ? "Select Tokens"
                    : !amountA || !amountB || amountA === "0" || amountB === "0"
                      ? "Enter Amounts"
                      : `Add Liquidity: ${selectedToken?.symbol}/${selectedOutputToken?.symbol}`}
            </Button>
          </div>
        )}
      </div>

      {/* Token Selector Modal */}
      <TokenSelector
        isOpen={isTokenModalOpen}
        onClose={closeTokenModal}
        type={selectedTokenModalType === "input" ? "pay" : "receive"}
      />
    </>
  );
};

export const AddLiquiditySection = ({
  disableTokenSelection,
}: {
  disableTokenSelection?: boolean;
}) => {
  return (
    <AddLiquidityProvider>
      <Card className="w-full max-w-full sm:max-w-lg md:max-w-xl mx-auto rounded-xl sm:rounded-2xl overflow-hidden shadow-sm border-0">
        <CardHeader className="pb-0">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-medium">Add Liquidity</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/pool" className="text-sm">
                  Back to Pools
                </Link>
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Add liquidity to receive LP tokens
          </p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <AddLiquidityForm disableTokenSelection={disableTokenSelection} />
        </CardContent>
      </Card>
    </AddLiquidityProvider>
  );
};
