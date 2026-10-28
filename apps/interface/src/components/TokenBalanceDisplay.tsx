import { TxModal } from "#/components/TxModal.js";
import { Button } from "#/components/ui/button.js";
import { Skeleton } from "#/components/ui/skeleton.js";
import { useAccount } from "#/hooks/use-account.js";
import { useIsDevEnvironment } from "#/hooks/use-is-dev-environment.js";
import { modals } from "#/lib/modal.js";
import { useBalance } from "#/lib/queries.js";
import { lib } from "#/lib/sdk.js";
import { sutils } from "@nemi-fi/utils";
import type { L2Token } from "@nemi-fi/v1-sdk";
import type { ReactNode } from "react";
import { assert } from "ts-essentials";

/** Testnet faucet amounts per token symbol. */
const MINT_AMOUNTS: Record<string, string> = {
  ETH: "0.1",
  DAI: "500",
  BTC: "0.0025",
  AAVE: "0.5",
  UNI: "25",
  SOL: "2",
};

/** "Balance: …" text with optional small action buttons next to it. */
export function BalanceRow({
  balance,
  isLoading,
  onMax,
  maxDisabled,
  children,
}: {
  balance: ReactNode;
  isLoading?: boolean;
  onMax?: () => void;
  maxDisabled?: boolean;
  children?: ReactNode;
}) {
  if (isLoading) {
    return <Skeleton className="h-5 w-32" />;
  }
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 sm:text-sm dark:text-gray-400">
      <span>Balance: {balance}</span>
      {children}
      {onMax && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 rounded-md px-2.5 text-xs font-medium"
          onClick={onMax}
          type="button"
          disabled={maxDisabled}
          aria-label="Set maximum balance"
        >
          Max
        </Button>
      )}
    </div>
  );
}

/** The connected wallet's balance of `token`, with Max and (testnet) Mint buttons. */
export function TokenBalanceDisplay({
  token,
  onMaxClick,
  showMintButton,
}: {
  token: L2Token;
  onMaxClick?: () => void;
  showMintButton?: boolean;
}) {
  const account = useAccount();
  const balanceResult = useBalance(account, token);
  const isDevEnvironment = useIsDevEnvironment();

  let mintAmountStr = MINT_AMOUNTS[token.symbol ?? ""];
  if (isDevEnvironment && Number(mintAmountStr)) {
    // devs can mint more
    mintAmountStr = (Number(mintAmountStr) * 100).toString();
  }

  const handleMintToken = () => {
    sutils.assertConnected(account);
    assert(mintAmountStr, `No mint amount found for token: ${token.symbol}`);
    const amount = sutils.parseCurrencyAmount(token, mintAmountStr);
    modals.show(TxModal, {
      sendTx: async () => {
        const tx = await lib.currency.mintPrivate({ to: account, amount });
        tx.wait().then(async () => {
          await sutils.sleep("5 sec"); // wait for node sync
          return balanceResult.refetch();
        });
        return tx;
      },
    });
  };

  return (
    <BalanceRow
      balance={
        balanceResult.data
          ? sutils.displayCurrencyAmount(balanceResult.data, {
              symbolPosition: false,
            })
          : "..."
      }
      onMax={onMaxClick}
      maxDisabled={balanceResult.isLoading}
    >
      {showMintButton && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 rounded-md px-2.5 text-xs font-medium"
          onClick={handleMintToken}
          type="button"
          aria-label={`Mint ${mintAmountStr} ${token.symbol || ""}`}
        >
          Mint {mintAmountStr}
        </Button>
      )}
    </BalanceRow>
  );
}
