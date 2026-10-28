import { Button } from "#/components/ui/button.js";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "#/components/ui/responsive-modal.js";
import { SearchInput } from "#/components/ui/search-input.js";
import { useAccount } from "#/hooks/use-account.js";
import type { TokenSide } from "#/hooks/use-token-selector-modal.js";
import { formatUsd } from "#/lib/format.js";
import { calculateUsdValue, TOKEN_PRICES } from "#/lib/prices.js";
import { useBalances } from "#/lib/queries.js";
import { cn } from "#/lib/utils.js";
import { sutils } from "@nemi-fi/utils";
import type { L2Token } from "@nemi-fi/v1-sdk";
import type { CurrencyAmount } from "@uniswap/sdk-core";
import { useMemo, useState } from "react";
import { useTokenContext } from "./TokenContext.js";
import { type Token } from "./types.js";

const TokenItem = ({
  token,
  balance,
  isDisabled,
  onClick,
}: {
  token: Token;
  balance: CurrencyAmount<L2Token> | undefined;
  isDisabled: boolean;
  onClick: () => void;
}) => {
  const account = useAccount();
  const hasBalance = Boolean(balance?.greaterThan(0));
  const tokenPrice = TOKEN_PRICES[token.symbol] || token.usdPrice || 0;

  return (
    <button
      className={cn(
        "flex w-full items-center gap-2 rounded-md p-2.5 text-left transition-colors sm:gap-3 sm:rounded-lg sm:p-3 md:gap-4 md:p-4",
        isDisabled
          ? "cursor-not-allowed bg-gray-50 opacity-50 dark:bg-neutral-800"
          : "hover:bg-blue-50 active:bg-blue-100 dark:hover:bg-neutral-700/60 dark:active:bg-neutral-700",
        hasBalance && "border-l-2 border-emerald-500",
      )}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={`Select ${token.name}${isDisabled ? " (Already selected)" : ""}`}
      data-token-id={token.id}
    >
      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full sm:h-9 sm:w-9 md:h-10 md:w-10">
        {token.logo}
      </div>
      <div className="flex min-w-0 flex-grow flex-col">
        <span className="truncate text-sm font-medium text-gray-900 md:text-base dark:text-gray-100">
          {token.name}
        </span>
        <span className="truncate text-xs text-gray-500 md:text-sm dark:text-gray-400">
          {token.symbol}
          {isDisabled && " (Already selected)"}
        </span>
      </div>
      <div className="flex flex-col items-end text-right">
        {account && (
          <div className="flex items-center gap-1 text-sm font-medium text-gray-900 md:text-base dark:text-gray-100">
            <span>{balance ? sutils.formatCurrencyAmount(balance) : "0"}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {token.symbol}
            </span>
          </div>
        )}
        <div className="flex flex-col text-xs text-gray-500 md:text-sm dark:text-gray-400">
          <div className="flex items-center">
            <span className="mr-1 text-gray-400 dark:text-gray-500">
              Price:
            </span>
            <span>{formatUsd(tokenPrice)}</span>
          </div>
          {account && balance && hasBalance && (
            <div className="flex items-center">
              <span className="mr-1 text-gray-400 dark:text-gray-500">
                Value:
              </span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {formatUsd(calculateUsdValue(balance))}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

type TokenSelectorProps = {
  isOpen: boolean;
  onClose: () => void;
  type: TokenSide;
};

export const TokenSelector = ({
  isOpen,
  onClose,
  type,
}: TokenSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyWithBalance, setShowOnlyWithBalance] = useState(false);
  const account = useAccount();
  const balances = useBalances(account);
  const {
    tokens,
    selectedToken,
    selectedOutputToken,
    setSelectedToken,
    setSelectedOutputToken,
  } = useTokenContext();

  const balanceByTokenId = new Map(
    balances.flatMap((result) =>
      result.data ? [[result.data.currency.address, result.data] as const] : [],
    ),
  );

  const filteredTokens = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return tokens.filter((token) => {
      const matchesSearch =
        !query ||
        token.name.toLowerCase().includes(query) ||
        token.symbol.toLowerCase().includes(query);
      const passesBalanceFilter =
        !account ||
        !showOnlyWithBalance ||
        Boolean(balanceByTokenId.get(token.id)?.greaterThan(0));
      return matchesSearch && passesBalanceFilter;
    });
    // balanceByTokenId is rebuilt each render from `balances`
  }, [tokens, searchQuery, account, showOnlyWithBalance, balances]);

  // The token picked on the other side can't be picked here too
  const otherSideToken = type === "pay" ? selectedOutputToken : selectedToken;

  const handleTokenSelect = (token: Token) => {
    if (type === "pay") {
      setSelectedToken(token);
    } else {
      setSelectedOutputToken(token);
    }
    onClose();
  };

  return (
    <ResponsiveModal open={isOpen} onOpenChange={onClose} breakpoint={640}>
      <ResponsiveModalContent
        className="gap-0 overflow-hidden p-0 focus:outline-none"
        dialogClassName="mx-auto max-w-[95vw] rounded-xl sm:max-w-md dark:bg-neutral-800"
        drawerClassName="max-h-[80vh]"
      >
        <ResponsiveModalHeader className="border-b border-gray-100 px-4 py-4 dark:border-neutral-700">
          <ResponsiveModalTitle className="text-lg font-bold">
            Select Token
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>

        <div className="flex flex-col space-y-2 border-b border-gray-100 px-3 py-3 dark:border-neutral-700">
          <SearchInput
            placeholder="Search tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search for tokens"
          />
          {account && (
            <Button
              variant={showOnlyWithBalance ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyWithBalance(!showOnlyWithBalance)}
              className="w-full text-xs"
            >
              {showOnlyWithBalance
                ? "Show all tokens"
                : "Show tokens with balance"}
            </Button>
          )}
        </div>

        <div className="max-h-[320px] min-h-[200px] overflow-y-auto px-2 py-2">
          {filteredTokens.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              {searchQuery
                ? "No tokens found matching your search"
                : showOnlyWithBalance
                  ? "No tokens with balance found"
                  : "No tokens available"}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-1 sm:gap-1.5 md:gap-2">
              {filteredTokens.map((token) => {
                const isDisabled = token.id === otherSideToken.id;
                return (
                  <TokenItem
                    key={token.id}
                    token={token}
                    balance={balanceByTokenId.get(token.id)}
                    isDisabled={isDisabled}
                    onClick={() => !isDisabled && handleTokenSelect(token)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};

TokenSelector.displayName = "TokenSelector";
