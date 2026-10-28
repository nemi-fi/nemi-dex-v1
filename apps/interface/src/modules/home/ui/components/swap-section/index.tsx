"use client";

import { TokenBalanceDisplay } from "#/components/TokenBalanceDisplay.js";
import { TransactionDetailRow, TxModal } from "#/components/TxModal.js";
import { FieldDivider, FieldLabel } from "#/components/ui/amount-field.js";
import { Button } from "#/components/ui/button.js";
import { useAccount } from "#/hooks/use-account.js";
import {
  exceedsBalance,
  isPositiveAmount,
  safeParseCurrencyAmount,
} from "#/lib/amount-input.js";
import { formatUsd } from "#/lib/format.js";
import { modals } from "#/lib/modal.js";
import { calculateUsdValue } from "#/lib/prices.js";
import { useBalance } from "#/lib/queries.js";
import { lib } from "#/lib/sdk.js";
import WalletConnect from "#/modules/home/ui/components/wallet-connect/index.js";
import { sutils } from "@nemi-fi/utils";
import type { L2Token } from "@nemi-fi/v1-sdk";
import type { CurrencyAmount } from "@uniswap/sdk-core";
import {
  ArrowDown,
  ArrowRightLeft,
  ArrowUp,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { SwapProvider, useSwapContext } from "./SwapContext.js";
import { SwapStats } from "./SwapStats.js";
import { useTokenContext } from "./TokenContext.js";
import { TokenInput } from "./TokenInput.js";
import { TokenSelector } from "./TokenSelector.js";

/**
 * @deprecated nuke this component
 */
const UsdValueDisplay = ({
  amount,
}: {
  amount: CurrencyAmount<L2Token> | undefined;
}) => {
  const value = amount ? calculateUsdValue(amount) : undefined;

  if (!value) {
    return null;
  }
  return (
    <div
      className="mt-1.5 px-1 text-sm text-gray-500 dark:text-gray-400"
      aria-live="polite"
    >
      = {formatUsd(value)} USD
    </div>
  );
};

const SwapForm = () => {
  // Get token context for token selection
  const { selectedToken, selectedOutputToken } = useTokenContext();

  // Get swap context for UI state and values
  const {
    payValue,
    payInputRef,
    receiveInputRef,
    isTokenModalOpen,
    currentSelection,
    closeTokenModal,
    handleSwitchTokens,
    quote,
    isCalculating,
    setPayValue,
    resetSwapForm,
  } = useSwapContext();

  // Get account and balance info
  const account = useAccount();
  const selectedTokenBalance = useBalance(account, selectedToken?.l2Token);

  // Handle max button click
  const handleMaxClick = () => {
    if (selectedTokenBalance.data) {
      setPayValue(sutils.formatCurrencyAmount(selectedTokenBalance.data));
    }
  };

  // Handle swap button click
  const handleSwap = () => {
    if (!payValue) return;

    // Make sure we're using the raw quote result directly
    if (!quote) throw new Error("No quote");

    // Store the modal reference so we can close it later
    modals.show(TxModal, {
      details: (
        <>
          <TransactionDetailRow
            icon={<ArrowUp className="h-4 w-4" />}
            label="You pay"
            value={sutils.displayCurrencyAmount(quote.amountIn)}
          />
          <TransactionDetailRow
            icon={<ArrowDown className="h-4 w-4" />}
            label="You receive"
            value={`~${sutils.displayCurrencyAmount(quote.amountOut)}`}
          />
          <TransactionDetailRow
            icon={<ArrowRightLeft className="h-4 w-4" />}
            label="Exchange Rate"
            value={sutils.displayPrice(quote.executionPrice)}
            bgClass="bg-blue-50 dark:bg-blue-900/20"
          />
          {/* TODO */}
          {/* <TransactionDetailRow
            icon={<Percent className="h-4 w-4" />}
            label="Slippage Tolerance"
            value={slippageTolerance}
            colorClass="text-amber-500"
            bgClass="bg-amber-50 dark:bg-amber-900/20"
            valueExtraClass="bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded"
          /> */}
        </>
      ),
      async sendTx() {
        sutils.assertConnected(account);
        const tx = await lib.universalRouter.executeQuote(account, quote);
        resetSwapForm();
        return tx;
      },
    });
  };

  // Determine if swap button should be disabled
  const hasOutputAmount = quote?.amountOut.greaterThan(0);

  const hasInsufficientBalance = exceedsBalance(
    selectedToken?.l2Token,
    payValue,
    selectedTokenBalance.data,
  );

  return (
    <div className="relative">
      <div className="mb-3 flex items-center">
        <div className="flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
          <ShieldCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-xs font-medium">Private Swap</span>
          <span className="ml-1.5 rounded bg-white/80 px-1 py-0.5 text-[10px] dark:bg-black/20">
            Shielded by zero-knowledge proofs
          </span>
        </div>
      </div>

      <div className="vibe-card px-6 py-5">
        {/* From token input */}
        <div className="mb-2 flex items-center justify-between gap-2">
          <FieldLabel>You pay</FieldLabel>
          {account && (
            <TokenBalanceDisplay
              token={selectedToken.l2Token}
              showMintButton={true}
              onMaxClick={handleMaxClick}
            />
          )}
        </div>
        <TokenInput ref={payInputRef} inputType="pay" label="You pay" />
        {payValue && (
          <UsdValueDisplay
            amount={safeParseCurrencyAmount(selectedToken.l2Token, payValue)}
          />
        )}

        {/* Switch tokens button */}
        <FieldDivider
          onClick={handleSwitchTokens}
          label="Switch tokens position"
        />

        {/* To token input */}
        <div className="mb-2 flex items-center justify-between gap-2">
          <FieldLabel>You receive</FieldLabel>
          {account && (
            <TokenBalanceDisplay token={selectedOutputToken.l2Token} />
          )}
        </div>
        <TokenInput
          ref={receiveInputRef}
          inputType="receive"
          label="You receive"
        />
        {quote?.amountOut.greaterThan(0) && !isCalculating && (
          <UsdValueDisplay amount={quote.amountOut} />
        )}

        {/* Show swap stats if we have quote data */}
        {quote && !isCalculating && (
          <div className="mt-4">
            <SwapStats />
          </div>
        )}

        {/* Action button */}
        <div className="mt-5" id="swap-section-btn">
          {!account ? (
            <WalletConnect fullWidth />
          ) : !selectedToken || !selectedOutputToken ? (
            <Button size="cta" disabled aria-label="Select tokens to swap">
              Select Tokens
            </Button>
          ) : !isPositiveAmount(payValue) ? (
            <Button size="cta" disabled aria-label="Enter an amount to swap">
              Enter Amount
            </Button>
          ) : hasInsufficientBalance ? (
            <Button
              size="cta"
              disabled
              aria-label={`Insufficient ${selectedToken.symbol} balance`}
            >
              Insufficient {selectedToken.symbol} balance
            </Button>
          ) : isCalculating ? (
            <Button
              size="cta"
              disabled
              aria-label="Calculating swap, please wait"
            >
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Calculating...
            </Button>
          ) : (
            <Button
              size="cta"
              aria-label="Initiate private swap of tokens"
              onClick={handleSwap}
              disabled={!hasOutputAmount}
            >
              <Lock className="h-4 w-4" />
              Private Swap
            </Button>
          )}
        </div>
      </div>

      {/* Token selector modal */}
      <TokenSelector
        isOpen={isTokenModalOpen}
        onClose={closeTokenModal}
        type={currentSelection}
      />
    </div>
  );
};

export const SwapSection = () => {
  return (
    <SwapProvider>
      <SwapForm />
      {/* <FloatingPrivacyNotice
        message="All transactions are private by default"
        position="bottom-right"
        timeout={8000}
      /> */}
    </SwapProvider>
  );
};
