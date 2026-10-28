"use client";

import {
  AmountField,
  AmountFieldSkeleton,
  amountInputClassName,
  FieldDivider,
  FieldLabel,
  TokenPill,
} from "#/components/ui/amount-field.js";
import { Button } from "#/components/ui/button.js";
import { Skeleton } from "#/components/ui/skeleton.js";
import { useAccount } from "#/hooks/use-account.js";
import { useTokenSelectorModal } from "#/hooks/use-token-selector-modal.js";
import {
  exceedsBalance,
  isPositiveAmount,
  sanitizeAmountInput,
} from "#/lib/amount-input.js";
import { useBalance } from "#/lib/queries.js";
import { TokenBalanceDisplay } from "#/components/TokenBalanceDisplay.js";
import { useTokenContext } from "#/modules/home/ui/components/swap-section/TokenContext.js";
import { TokenSelector } from "#/modules/home/ui/components/swap-section/TokenSelector.js";
import WalletConnect from "#/modules/home/ui/components/wallet-connect/index.js";
import { sutils } from "@nemi-fi/utils";
import { Plus } from "lucide-react";
import { PoolFormLayout } from "../PoolFormLayout.js";
import React, { useRef } from "react";
import {
  AddLiquidityProvider,
  useAddLiquidityContext,
} from "./AddLiquidityContext.js";

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
    addLiquidity,
    isPoolExisting,
    allowBothInputs,
    shouldAutoFill,
    isPoolLoading,
  } = useAddLiquidityContext();

  const { selectedToken, selectedOutputToken, isTokensLoading } =
    useTokenContext();
  const tokenSelector = useTokenSelectorModal();
  const account = useAccount();

  // Get balances
  const tokenABalance = useBalance(account, selectedToken?.l2Token);
  const tokenBBalance = useBalance(account, selectedOutputToken?.l2Token);

  // Input references for focus management
  const tokenAInputRef = useRef<HTMLInputElement>(null);
  const tokenBInputRef = useRef<HTMLInputElement>(null);

  // Handle input for token A and update
  const handleTokenAInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeAmountInput(
      e.target.value,
      selectedToken?.l2Token?.decimals,
    );
    if (value !== null) setAmountA(value);
  };

  // Handle input for token B (only enabled if manual input is allowed)
  const handleTokenBInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeAmountInput(
      e.target.value,
      selectedOutputToken?.l2Token?.decimals,
    );
    if (value !== null) setAmountB(value);
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

  const insufficientToken = exceedsBalance(
    selectedToken?.l2Token,
    amountA,
    tokenABalance.data,
  )
    ? selectedToken
    : exceedsBalance(selectedOutputToken?.l2Token, amountB, tokenBBalance.data)
      ? selectedOutputToken
      : undefined;

  // Determine if add liquidity button should be disabled
  const isAddLiquidityDisabled =
    !isPositiveAmount(amountA) ||
    !isPositiveAmount(amountB) ||
    !account ||
    isPoolLoading ||
    isTokensLoading ||
    isCalculating ||
    !!insufficientToken ||
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
      <div>
        {/* Pool status notice */}
        {poolStatus && (
          <div
            className={`mb-5 p-3 rounded-xl text-sm border ${
              poolStatus.type === "loading"
                ? "bg-gray-50 text-gray-700 border-gray-200 dark:bg-neutral-700/50 dark:text-gray-300 dark:border-neutral-600"
                : poolStatus.type === "new"
                  ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30"
                  : "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/30"
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
        <div className="mb-2 flex items-center justify-between gap-2">
          <FieldLabel>First Token</FieldLabel>
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
          <AmountFieldSkeleton />
        ) : (
          <AmountField
            className="cursor-text"
            onClick={() => tokenAInputRef.current?.focus()}
          >
            <input
              ref={tokenAInputRef}
              placeholder="0.00"
              type="text"
              className={amountInputClassName}
              onKeyDown={handleNumericInput}
              inputMode="decimal"
              autoComplete="off"
              value={amountA}
              onChange={handleTokenAInput}
              aria-label="Enter amount for token A"
              disabled={isLoading}
            />
            <TokenPill
              logo={selectedToken?.logo}
              symbol={selectedToken?.symbol}
              showChevron={!disableTokenSelection}
              onClick={(e) => {
                e.stopPropagation();
                if (!disableTokenSelection) {
                  tokenSelector.open("pay");
                }
              }}
              disabled={isLoading || disableTokenSelection}
            />
          </AmountField>
        )}

        {/* Middle icon */}
        <FieldDivider icon={<Plus className="h-[18px] w-[18px]" />} />

        {/* Token B Input */}
        <div className="mb-2 flex items-center justify-between gap-2">
          <FieldLabel>Second Token</FieldLabel>
          {account && !isLoading && (
            <TokenBalanceDisplay
              token={selectedOutputToken.l2Token}
              showMintButton
              // Amount B follows amount A unless the pool lets you set your own ratio
              onMaxClick={allowBothInputs ? handleMaxB : undefined}
            />
          )}
          {account && isLoading && <Skeleton className="h-5 w-32" />}
        </div>

        {isLoading ? (
          <AmountFieldSkeleton />
        ) : (
          <AmountField
            className={
              allowBothInputs
                ? "cursor-text"
                : isCalculating
                  ? "cursor-wait"
                  : undefined
            }
            onClick={() => allowBothInputs && tokenBInputRef.current?.focus()}
          >
            <input
              ref={tokenBInputRef}
              placeholder="0.00"
              type="text"
              className={amountInputClassName}
              onKeyDown={handleNumericInput}
              inputMode="decimal"
              autoComplete="off"
              value={amountB}
              onChange={handleTokenBInput}
              aria-label="Enter amount for token B"
              readOnly={!allowBothInputs}
              disabled={isLoading}
            />
            <TokenPill
              logo={selectedOutputToken?.logo}
              symbol={selectedOutputToken?.symbol}
              showChevron={!disableTokenSelection}
              onClick={(e) => {
                e.stopPropagation();
                if (!disableTokenSelection) {
                  tokenSelector.open("receive");
                }
              }}
              disabled={isLoading || disableTokenSelection}
            />
          </AmountField>
        )}

        {/* Action Button */}
        <div className="mt-6">
          {!account ? (
            <WalletConnect fullWidth />
          ) : (
            <Button
              size="cta"
              disabled={isAddLiquidityDisabled}
              onClick={addLiquidity}
            >
              {isTokensLoading
                ? "Loading Tokens..."
                : isPoolLoading
                  ? "Loading Pool Data..."
                  : !selectedToken?.symbol || !selectedOutputToken?.symbol
                    ? "Select Tokens"
                    : !isPositiveAmount(amountA) || !isPositiveAmount(amountB)
                      ? "Enter Amounts"
                      : insufficientToken
                        ? `Insufficient ${insufficientToken.symbol} balance`
                        : `Add Liquidity: ${selectedToken?.symbol}/${selectedOutputToken?.symbol}`}
            </Button>
          )}
        </div>
      </div>

      {/* Token Selector Modal */}
      <TokenSelector
        isOpen={tokenSelector.isOpen}
        onClose={tokenSelector.close}
        type={tokenSelector.side}
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
      <PoolFormLayout
        title="Add Liquidity"
        className="sm:max-w-lg md:max-w-xl"
        description="Add liquidity to a pool to receive LP tokens and earn a share of the trading fees."
      >
        <AddLiquidityForm disableTokenSelection={disableTokenSelection} />
      </PoolFormLayout>
    </AddLiquidityProvider>
  );
};
