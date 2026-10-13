import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { useAccount } from "@/hooks/use-account";
import { useBalance } from "@/lib/queries";
import { sutils } from "@nemi-fi/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TOKEN_PRICES } from "./constants";
import { useTokenContext } from "./TokenContext";
import { type Token } from "./types";

// TokenBalance component that safely uses the useBalance hook
const TokenBalance = ({
  token,
  onBalanceLoad,
}: {
  token: Token;
  onBalanceLoad: (tokenId: string, hasBalance: boolean) => void;
}) => {
  const account = useAccount();
  const balanceResult = useBalance(account, token.l2Token);
  const balance = balanceResult.data
    ? sutils.formatCurrencyAmount(balanceResult.data)
    : "0";
  const numericBalance = parseFloat(balance) || 0;
  const hasBalance = numericBalance > 0;

  // Report balance back to parent component
  useEffect(() => {
    if (account) {
      onBalanceLoad(token.id, hasBalance);
    }
  }, [token.id, hasBalance, account, onBalanceLoad]);

  return null; // This is just a hook wrapper, no UI
};

// TokenItem component that shows a token with its balance
const TokenItem = ({
  token,
  isDisabled,
  onClick,
}: {
  token: Token;
  isDisabled: boolean;
  onClick: () => void;
}) => {
  const account = useAccount();
  const balanceResult = useBalance(account, token.l2Token);
  const balance = balanceResult.data
    ? sutils.formatCurrencyAmount(balanceResult.data)
    : "0";
  const numericBalance = parseFloat(balance) || 0;
  const hasBalance = numericBalance > 0;

  const tokenPrice = TOKEN_PRICES[token.symbol] || token.usdPrice || 0;
  const totalUsdValue = numericBalance * tokenPrice;

  return (
    <button
      className={`flex items-center gap-2 sm:gap-3 md:gap-4 p-2.5 sm:p-3 md:p-4 rounded-md sm:rounded-lg text-left transition-colors w-full ${
        isDisabled
          ? "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800"
          : "hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700"
      } ${hasBalance ? "border-l-2 border-emerald-500" : ""}`}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={`Select ${token.name}${
        isDisabled ? " (Already selected)" : ""
      }`}
      data-token-id={token.id}
      data-has-balance={hasBalance ? "true" : "false"}
    >
      <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full overflow-hidden flex-shrink-0">
        {token.logo}
      </div>
      <div className="flex flex-col flex-grow min-w-0">
        <span className="font-medium text-sm sm:text-sm md:text-base truncate text-gray-900 dark:text-gray-100">
          {token.name}
        </span>
        <span className="text-xs sm:text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">
          {token.symbol}
          {isDisabled && " (Already selected)"}
        </span>
      </div>
      <div className="text-right flex flex-col items-end">
        {account && (
          <div className="font-medium text-sm sm:text-sm md:text-base flex items-center gap-1 text-gray-900 dark:text-gray-100">
            <span>{balance}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {token.symbol}
            </span>
          </div>
        )}
        <div className="flex flex-col text-xs sm:text-xs md:text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <span className="text-gray-400 dark:text-gray-500 mr-1">
              Price:
            </span>
            <span>
              $
              {tokenPrice.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          {account && hasBalance && (
            <div className="flex items-center">
              <span className="text-gray-400 dark:text-gray-500 mr-1">
                Value:
              </span>
              <span className="text-emerald-600 dark:text-emerald-400">
                $
                {totalUsdValue.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
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
  type: "pay" | "receive";
};

export const TokenSelector = ({
  isOpen,
  onClose,
  type,
}: TokenSelectorProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyWithBalance, setShowOnlyWithBalance] = useState(false);
  const [tokensWithBalance, setTokensWithBalance] = useState<Set<string>>(
    new Set(),
  );
  const account = useAccount();
  const {
    tokens,
    selectedToken,
    selectedOutputToken,
    setSelectedToken,
    setSelectedOutputToken,
  } = useTokenContext();

  // Filter tokens based on search query
  const filteredBySearch = useMemo(() => {
    return searchQuery
      ? tokens.filter(
          (token) =>
            token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            token.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : tokens;
  }, [tokens, searchQuery]);

  // Further filter by balance if needed
  const filteredTokens = useMemo(() => {
    if (account && showOnlyWithBalance) {
      return filteredBySearch.filter((token) =>
        tokensWithBalance.has(token.id),
      );
    }
    return filteredBySearch;
  }, [filteredBySearch, account, showOnlyWithBalance, tokensWithBalance]);

  // Check if on mobile device
  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth < 640);
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Handle balance information from child components
  const handleBalanceLoad = useCallback(
    (tokenId: string, hasBalance: boolean) => {
      setTokensWithBalance((prev) => {
        const newSet = new Set(prev);
        if (hasBalance) {
          newSet.add(tokenId);
        } else {
          newSet.delete(tokenId);
        }
        return newSet;
      });
    },
    [],
  );

  // Check if a token is disabled (already selected in the other field)
  const isTokenDisabled = (token: Token) => {
    if (type === "pay") {
      return token.id === selectedOutputToken.id;
    } else {
      return token.id === selectedToken.id;
    }
  };

  // Handle token selection
  const handleTokenSelect = (token: Token) => {
    if (type === "pay") {
      setSelectedToken(token);
    } else {
      setSelectedOutputToken(token);
    }
    onClose();
  };

  // Handle filter toggle
  const handleToggleBalanceFilter = () => {
    setShowOnlyWithBalance(!showOnlyWithBalance);
  };

  // Load all token balances in background (invisible components)
  const balanceLoaders = tokens.map((token) => (
    <TokenBalance
      key={`balance-${token.id}`}
      token={token}
      onBalanceLoad={handleBalanceLoad}
    />
  ));

  // Common token list rendered in both mobile and desktop
  const renderTokenList = () => {
    if (filteredTokens.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          {searchQuery
            ? "No tokens found matching your search"
            : showOnlyWithBalance
              ? "No tokens with balance found"
              : "No tokens available"}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-1 sm:gap-1.5 md:gap-2">
        {filteredTokens.map((token) => {
          const isDisabled = isTokenDisabled(token);

          return (
            <TokenItem
              key={token.id}
              token={token}
              isDisabled={isDisabled}
              onClick={() => !isDisabled && handleTokenSelect(token)}
            />
          );
        })}
      </div>
    );
  };

  // Common search input rendered in both mobile and desktop
  const renderSearchInput = () => (
    <div className="flex flex-col space-y-2">
      <Input
        placeholder="Search token"
        className="border rounded-lg focus-visible:ring-1 h-9 sm:h-10 md:h-11 text-sm sm:text-sm md:text-base px-3"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        aria-label="Search for tokens"
      />
      {account && (
        <div className="flex items-center">
          <Button
            variant={showOnlyWithBalance ? "default" : "outline"}
            size="sm"
            onClick={handleToggleBalanceFilter}
            className="text-xs w-full"
          >
            {showOnlyWithBalance
              ? "Show all tokens"
              : "Show tokens with balance"}
          </Button>
        </div>
      )}
    </div>
  );

  // Mobile drawer view
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose} direction="bottom">
        <DrawerContent className="px-0 focus:outline-none max-h-[80vh]">
          <DrawerHeader className="px-4 pt-4 pb-2">
            <DrawerTitle className="text-base font-semibold">
              Select a token
            </DrawerTitle>
          </DrawerHeader>

          <div className="px-4 py-2">{renderSearchInput()}</div>

          <div className="overflow-y-auto px-2 pb-4 max-h-[calc(80vh-120px)]">
            {/* Hidden balance loaders */}
            <div className="sr-only">{balanceLoaders}</div>
            {renderTokenList()}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop dialog view
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-sm md:max-w-md mx-auto rounded-lg sm:rounded-xl p-0 overflow-hidden">
        <DialogHeader className="px-4 sm:px-5 md:px-6 pt-4 sm:pt-5 md:pt-6 pb-2 sm:pb-3 md:pb-4">
          <DialogTitle className="text-base sm:text-lg md:text-xl font-semibold">
            Select a token
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 sm:px-5 md:px-6 py-2 sm:py-3 md:py-4">
          {renderSearchInput()}
        </div>

        <div className="max-h-[240px] sm:max-h-[280px] md:max-h-[320px] overflow-y-auto px-2 sm:px-3 md:px-4 pb-4 sm:pb-5 md:pb-6">
          {/* Hidden balance loaders */}
          <div className="sr-only">{balanceLoaders}</div>
          {renderTokenList()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

TokenSelector.displayName = "TokenSelector";
