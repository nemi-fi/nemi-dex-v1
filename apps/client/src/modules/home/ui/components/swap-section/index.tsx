"use client";

import { TransactionDetailRow, TxModal } from "@/components/TxModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  PrivacyAlert,
  PrivacyFeatureAlert,
} from "@/components/ui/privacy-alert";
import { useAccount } from "@/hooks/use-account";
import { useIsDevEnvironment } from "@/hooks/use-is-dev-environment";
import { safeParseCurrencyAmount, useSwap } from "@/hooks/use-swap";
import { modals } from "@/lib/modal";
import { useBalance } from "@/lib/queries";
import { lib } from "@/lib/sdk";
import { WalletConnectModal } from "@/modules/home/ui/components/wallet-connect/WalletConnectModal";
import { sutils } from "@nemi-fi/utils";
import type { L2Token } from "@nemi-fi/v1-sdk";
import type { CurrencyAmount } from "@uniswap/sdk-core";
import { ArrowDown, ArrowRightLeft, ArrowUp, Lock, Wallet } from "lucide-react";
import { useOnborda } from "onborda";
import { useEffect, useRef, useState } from "react";
import { assert } from "ts-essentials";
import { calculateUsdValue } from "./constants";
import { SwapProvider, useSwapContext } from "./SwapContext";
import { SwapStats } from "./SwapStats";
import { useTokenContext } from "./TokenContext";
import { TokenInput } from "./TokenInput";
import { TokenSelector } from "./TokenSelector";

export const TokenBalanceDisplay = ({
  token,
  onMaxClick,
  showMintButton,
}: {
  token: L2Token;
  onMaxClick?: () => void;
  showMintButton?: boolean;
}) => {
  const account = useAccount();
  const balanceResult = useBalance(account, token);

  const mintAmounts: Record<string, string> = {
    ETH: "0.1",
    DAI: "500",
    BTC: "0.0025",
    AAVE: "0.5",
    UNI: "25",
    SOL: "2",
  };
  let mintAmountStr = mintAmounts[token.symbol ?? ""];
  const isDevEnvironment = useIsDevEnvironment();

  if (isDevEnvironment && Number(mintAmountStr)) {
    // devs can mint more
    mintAmountStr = (Number(mintAmountStr) * 100).toString();
  }

  // Test function to mint tokens (for development only)
  const handleMintToken = async () => {
    sutils.assertConnected(account);

    assert(mintAmountStr, `No mint amount found for token: ${token.symbol}`);
    const amount = sutils.parseCurrencyAmount(token, mintAmountStr);
    modals.show(TxModal, {
      sendTx: async () => {
        const tx = await lib.currency.mintPrivate({
          to: account,
          amount,
        });
        tx.wait().then(async () => {
          await sutils.sleep("5 sec"); // wait for node sync
          console.log("refetch balance", token.symbol);
          return balanceResult.refetch();
        });
        return tx;
      },
    });
  };

  return (
    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
      <span>
        Balance:{" "}
        {!balanceResult.data
          ? "..."
          : sutils.displayCurrencyAmount(balanceResult.data, {
              symbolPosition: false,
            })}
      </span>
      {showMintButton && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-xs font-medium rounded-md border-primary hover:bg-primary/10"
          onClick={handleMintToken}
          type="button"
          aria-label={`Mint ${mintAmountStr} ${token.symbol || ""}`}
        >
          Mint {mintAmountStr}
        </Button>
      )}
      {onMaxClick && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-xs font-medium rounded-md border-gray-300 hover:bg-gray-100"
          onClick={onMaxClick}
          type="button"
          disabled={balanceResult.isLoading}
          aria-label="Set maximum balance"
        >
          Max
        </Button>
      )}
    </div>
  );
};

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
      className="text-gray-500 text-sm pl-3 sm:pl-4"
      aria-live="polite"
      aria-label={`Equivalent to ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} US dollars`}
    >
      = $
      {value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}{" "}
      USD
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

  // Get swap execution functionality
  const { setFromToken, setToToken, handleFromAmountChange, executeSwap } =
    useSwap();

  // Get account and balance info
  const account = useAccount();
  const selectedTokenBalance = useBalance(account, selectedToken?.l2Token);

  // Track previous pay value to avoid unnecessary updates
  const prevPayValueRef = useRef(payValue);

  // Sync with swap hook when a quote is calculated
  useEffect(() => {
    if (quote && payValue !== prevPayValueRef.current) {
      handleFromAmountChange(payValue);
      prevPayValueRef.current = payValue;
    }
  }, [quote, payValue, handleFromAmountChange]);

  // Wallet connect modal state
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // Sync token selections with the swap hook
  useEffect(() => {
    if (selectedToken?.l2Token) setFromToken(selectedToken.l2Token);
    if (selectedOutputToken?.l2Token) setToToken(selectedOutputToken.l2Token);
  }, [selectedToken, selectedOutputToken, setFromToken, setToToken]);

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
        const txResult = await executeSwap(quote);
        if (!txResult) throw new Error("Swap failed. Please try again.");

        resetSwapForm();

        return txResult;
      },
    });
  };

  // Determine if swap button should be disabled
  const hasOutputAmount = quote?.amountOut.greaterThan(0);

  return (
    <Card className="overflow-hidden border-neutral-200 dark:border-neutral-800 shadow-md">
      <CardContent className="p-0">
        {/* Privacy Alert Banner */}

        <PrivacyAlert
          variant="primary"
          title="Innovative Private Transactions"
          description="All your transactions are shielded and your address is private."
          className="mb-3"
          elevated={true}
        />

        <div className="p-4 sm:p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Private Swap</h2>
            </div>
          </div>
          {/* From token input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div
                className="bg-yellow-100 text-yellow-800 font-semibold text-sm leading-none py-1.5 px-3 rounded-full w-fit mb-1.5"
                role="text"
                aria-label="You pay section"
              >
                You pay
              </div>
              {account && (
                <TokenBalanceDisplay
                  token={selectedToken.l2Token}
                  showMintButton={true}
                  onMaxClick={handleMaxClick}
                />
              )}
            </div>
            <TokenInput
              ref={payInputRef}
              inputType="pay"
              labelColor="yellow"
              label="You pay"
            />
            <div className="flex items-center justify-between px-1">
              {payValue && (
                <UsdValueDisplay
                  amount={safeParseCurrencyAmount(
                    selectedToken.l2Token,
                    payValue,
                  )}
                />
              )}
            </div>
          </div>

          {/* Switch tokens button */}
          <div className="relative h-8 my-2">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-t border-gray-200 dark:border-gray-800 w-full" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-8 w-8 border-0 shadow-sm hover:bg-gray-50 active:bg-gray-100"
                onClick={handleSwitchTokens}
                aria-label="Switch tokens position"
              >
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                </>
              </Button>
            </div>
          </div>

          {/* To token input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div
                className="bg-pink-100 text-pink-500 font-semibold text-sm leading-none py-1.5 px-3 rounded-full w-fit mb-1.5"
                role="text"
                aria-label="You receive section"
              >
                You receive
              </div>
              {account && (
                <TokenBalanceDisplay token={selectedOutputToken.l2Token} />
              )}
            </div>
            <TokenInput
              ref={receiveInputRef}
              inputType="receive"
              labelColor="pink"
              label="You receive"
            />
            <div className="flex items-center justify-between px-1">
              {quote?.amountOut.greaterThan(0) && !isCalculating && (
                <UsdValueDisplay amount={quote.amountOut} />
              )}
            </div>
          </div>

          {/* Privacy feature alerts */}
          <div className="mt-4 space-y-2">
            <PrivacyFeatureAlert
              feature="Zero-knowledge proofs ensure privacy"
              icon="shield"
              color="purple"
            />
          </div>

          {/* Show swap stats if we have quote data */}
          {quote && !isCalculating && (
            <div className="mt-4">
              <SwapStats />
            </div>
          )}

          {/* Action button */}
          <div className="mt-5" id="swap-section-btn">
            {!account ? (
              <Button
                className="w-full py-5 text-lg font-semibold"
                onClick={() => setIsWalletModalOpen(true)}
                aria-label="Connect your wallet to start swapping"
              >
                <Wallet className="mr-2 h-5 w-5" /> Connect Wallet
              </Button>
            ) : !selectedToken || !selectedOutputToken ? (
              <Button
                className="w-full py-5 text-lg font-semibold"
                disabled
                aria-label="Select tokens to swap"
              >
                Select Tokens
              </Button>
            ) : !payValue || payValue === "0" ? (
              <Button
                className="w-full py-5 text-lg font-semibold"
                disabled
                aria-label="Enter an amount to swap"
              >
                Enter Amount
              </Button>
            ) : isCalculating ? (
              <Button
                className="w-full py-5 text-lg font-semibold"
                disabled
                aria-label="Calculating swap, please wait"
              >
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  role="img"
                  aria-label="Loading indicator"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Calculating...
              </Button>
            ) : (
              <Button
                className="w-full py-5 text-lg font-semibold relative overflow-hidden bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-indigo-500/20 animate-button-shimmer"
                aria-label="Initiate private swap of tokens"
                onClick={handleSwap}
                disabled={!hasOutputAmount}
              >
                <span className="flex items-center justify-center gap-2 relative z-10">
                  <Lock className="h-4 w-4" />
                  Private Swap
                </span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      {/* Token selector modal */}
      <TokenSelector
        isOpen={isTokenModalOpen}
        onClose={closeTokenModal}
        type={currentSelection}
      />

      {/* Wallet connect modal */}
      <WalletConnectModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </Card>
  );
};

export const SwapSection = () => {
  const { startOnborda } = useOnborda();
  const handleStartOnborda = (tourName: string) => {
    startOnborda(tourName);
  };

  return (
    <SwapProvider>
      {/* <Button size="lg" onClick={() => handleStartOnborda("tour1")}>
        Start Tour 1
      </Button> */}
      <SwapForm />
      {/* <FloatingPrivacyNotice
        message="All transactions are private by default"
        position="bottom-right"
        timeout={8000}
      /> */}
    </SwapProvider>
  );
};
