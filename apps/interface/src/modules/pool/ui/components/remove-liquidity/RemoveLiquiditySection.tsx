"use client";

import { BalanceRow } from "#/components/TokenBalanceDisplay.js";
import {
  AmountField,
  AmountFieldSkeleton,
  amountInputClassName,
  FieldDivider,
  FieldLabel,
  TokenPill,
} from "#/components/ui/amount-field.js";
import { Button } from "#/components/ui/button.js";
import { useAccount } from "#/hooks/use-account.js";
import {
  type TokenSide,
  useTokenSelectorModal,
} from "#/hooks/use-token-selector-modal.js";
import { isPositiveAmount, sanitizeAmountInput } from "#/lib/amount-input.js";
import { TokenSelector } from "#/modules/home/ui/components/swap-section/TokenSelector.js";
import { useTokenContext } from "#/modules/home/ui/components/swap-section/TokenContext.js";
import WalletConnect from "#/modules/home/ui/components/wallet-connect/index.js";
import { sutils } from "@nemi-fi/utils";
import { ArrowDown, Plus } from "lucide-react";
import { useRef } from "react";
import { PoolFormLayout } from "../PoolFormLayout.js";
import {
  RemoveLiquidityProvider,
  useRemoveLiquidityContext,
} from "./RemoveLiquidityContext.js";

const RemoveLiquidityForm = ({
  disableTokenSelection,
}: {
  disableTokenSelection?: boolean;
}) => {
  const {
    lpAmount,
    setLpAmount,
    handleNumericInput,
    removeLiquidity,
    outputAmounts,
    lpTokenBalance,
    isLoading,
    error,
    handleMaxAmount,
  } = useRemoveLiquidityContext();
  const { selectedToken, selectedOutputToken, isTokensLoading } =
    useTokenContext();
  const account = useAccount();
  const tokenSelector = useTokenSelectorModal();
  const lpInputRef = useRef<HTMLInputElement>(null);

  const isFormLoading = isLoading || isTokensLoading;
  const hasNoLiquidity = lpTokenBalance === "0";

  const poolSymbol =
    selectedToken?.symbol && selectedOutputToken?.symbol
      ? `${selectedToken.symbol}-${selectedOutputToken.symbol}`
      : "LP";

  const isRemoveLiquidityDisabled =
    !isPositiveAmount(lpAmount) ||
    !outputAmounts ||
    !account ||
    isFormLoading ||
    !!error;

  const buttonLabel = isFormLoading
    ? "Loading..."
    : hasNoLiquidity
      ? "No Liquidity to Remove"
      : !isPositiveAmount(lpAmount)
        ? "Enter LP Amount"
        : "Remove Liquidity";

  const outputs = [
    {
      side: "pay" as TokenSide,
      token: selectedToken,
      amount: outputAmounts?.amount0,
      label: "Amount of token A to receive",
    },
    {
      side: "receive" as TokenSide,
      token: selectedOutputToken,
      amount: outputAmounts?.amount1,
      label: "Amount of token B to receive",
    },
  ];

  return (
    <div>
      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {/* LP Token Input */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <FieldLabel>Liquidity tokens</FieldLabel>
        {account && (
          <BalanceRow
            isLoading={isFormLoading}
            balance={`${lpTokenBalance} ${poolSymbol}`}
            onMax={hasNoLiquidity ? undefined : handleMaxAmount}
          />
        )}
      </div>

      {isFormLoading ? (
        <AmountFieldSkeleton />
      ) : (
        <AmountField
          className="cursor-text"
          onClick={() => lpInputRef.current?.focus()}
        >
          <input
            ref={lpInputRef}
            placeholder="0.00"
            type="text"
            className={amountInputClassName}
            onKeyDown={handleNumericInput}
            inputMode="decimal"
            autoComplete="off"
            value={lpAmount}
            onChange={(e) => {
              const value = sanitizeAmountInput(e.target.value);
              if (value !== null) setLpAmount(value);
            }}
            aria-label="Enter amount of LP tokens to remove"
            disabled={hasNoLiquidity}
          />
          <span className="flex h-8 max-w-[160px] shrink-0 items-center truncate rounded-full bg-white px-3 text-sm font-medium shadow-sm dark:bg-zinc-800 dark:text-white">
            {poolSymbol}
          </span>
        </AmountField>
      )}

      {account && hasNoLiquidity && !isFormLoading && (
        <div className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
          You don't have any LP tokens for this pool
        </div>
      )}

      <FieldDivider icon={<ArrowDown className="h-[18px] w-[18px]" />} />

      <div className="mb-2">
        <FieldLabel>You receive</FieldLabel>
      </div>

      {outputs.map(({ side, token, amount, label }, index) => (
        <div key={side}>
          {index > 0 && (
            <FieldDivider icon={<Plus className="h-[18px] w-[18px]" />} />
          )}
          {isFormLoading ? (
            <AmountFieldSkeleton />
          ) : (
            <AmountField>
              <input
                placeholder="0.00"
                type="text"
                readOnly
                className={amountInputClassName}
                value={amount ? sutils.formatCurrencyAmount(amount) : ""}
                aria-label={label}
              />
              <TokenPill
                logo={token?.logo}
                symbol={token?.symbol}
                onClick={() => tokenSelector.open(side)}
                disabled={disableTokenSelection}
                showChevron={!disableTokenSelection}
              />
            </AmountField>
          )}
        </div>
      ))}

      <div className="mt-6">
        {!account ? (
          <WalletConnect fullWidth />
        ) : (
          <Button
            size="cta"
            onClick={removeLiquidity}
            disabled={isRemoveLiquidityDisabled}
          >
            {buttonLabel}
          </Button>
        )}
      </div>

      <TokenSelector
        isOpen={tokenSelector.isOpen}
        onClose={tokenSelector.close}
        type={tokenSelector.side}
      />
    </div>
  );
};

export const RemoveLiquiditySection = ({
  disableTokenSelection,
}: {
  disableTokenSelection?: boolean;
}) => (
  <PoolFormLayout
    title="Remove Liquidity"
    className="md:max-w-lg"
    description="Burn your LP tokens to withdraw your share of the pool."
  >
    <RemoveLiquidityProvider>
      <RemoveLiquidityForm disableTokenSelection={disableTokenSelection} />
    </RemoveLiquidityProvider>
  </PoolFormLayout>
);
