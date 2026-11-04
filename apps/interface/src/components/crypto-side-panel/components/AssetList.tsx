import { Query } from "#/components/Query.js";
import { SearchInput } from "#/components/ui/search-input.js";
import { TokenIcon } from "#/components/TokenIcon.js";
import { Label } from "#/components/ui/label.js";
import { Skeleton } from "#/components/ui/skeleton.js";
import { Switch } from "#/components/ui/switch.js";
import { useAccount } from "#/hooks/use-account.js";
import { type TokenBalance, useWalletBalances } from "#/lib/queries.js";
import { cn } from "#/lib/utils.js";
import { formatUsd } from "#/lib/format.js";
import { useUsdValue } from "#/lib/prices.js";
import { sutils } from "@nemi-fi/utils";
import { GlobeIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import { useState } from "react";

// Get network color
function getNetworkColor(network: string): string {
  switch (network) {
    case "ETH":
      return "bg-[#F2EADF]";
    case "BTC":
      return "bg-[#F5BD28]";
    case "SOL":
      return "bg-[#14F195]";
    case "AVAX":
      return "bg-[#EA789C]";
    case "MATIC":
    case "POL":
      return "bg-[#F5BD28]";
    case "USDC":
      return "bg-[#2A6235]";
    case "USDT":
      return "bg-[#2A6235]";
    default:
      return "bg-[#F2EADF]";
  }
}

// Asset item component
function AssetItem({
  balance: { total, ...balance },
}: {
  balance: TokenBalance;
}) {
  const token = total.currency;
  const networkColor = getNetworkColor(token.symbol || "Unknown");
  const { calculateUsdValue } = useUsdValue();
  const usdValue = calculateUsdValue(total);

  return (
    <div className="flex items-center justify-between py-4 px-4 border-b last:border-b-0 hover:bg-muted/50 dark:hover:bg-gray-800/50 transition-colors animate-in fade-in-0">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br",
            networkColor,
          )}
          aria-hidden="true"
        >
          <TokenIcon token={token} size={20} />
        </div>
        <div>
          <div className="font-medium text-base">
            {token.name || "Unknown Token"}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <ShieldCheckIcon className="h-3 w-3" aria-hidden="true" />
            <span>
              Private: {sutils.displayCurrencyAmount(balance.private)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <GlobeIcon className="h-3 w-3" aria-hidden="true" />
            <span>Public: {sutils.displayCurrencyAmount(balance.public)}</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-medium text-base">{formatUsd(usdValue)}</div>
      </div>
    </div>
  );
}

export function AssetSkeleton() {
  return (
    <div className="flex items-center justify-between py-4 px-4 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-[120px]" />
          <Skeleton className="h-4 w-[80px]" />
        </div>
      </div>
      <div className="text-right space-y-2">
        <Skeleton className="h-5 w-[60px]" />
        <Skeleton className="h-4 w-[40px]" />
      </div>
    </div>
  );
}

// Add new skeleton component for controls
function ControlsSkeleton() {
  return (
    <div className="px-4 py-3 border-b">
      <div className="flex flex-col gap-3">
        {/* Search Bar Skeleton */}
        <div className="relative">
          <Skeleton className="h-9 w-full" />
        </div>

        {/* Filter Controls Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-9 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AssetList() {
  const [searchQuery, setSearchQuery] = useState("");
  const account = useAccount();
  const balances = useWalletBalances(account);
  const [hideZeroBalance, setHideZeroBalance] = useState(false);

  const filteredBalances = balances?.filter((x) => {
    if (!x.data) {
      return true;
    }
    const { total } = x.data;

    const matchesSearch =
      total.currency.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      total.currency.symbol?.toLowerCase().includes(searchQuery.toLowerCase());

    const hasBalance = !hideZeroBalance || total.greaterThan(0);

    return matchesSearch && hasBalance;
  });

  const isLoading = balances?.some((b) => b.isLoading) ?? true;

  return (
    <div>
      {/* Controls Section */}
      {isLoading ? (
        <ControlsSkeleton />
      ) : (
        <div className="py-3 border-b mb-4">
          <div className="flex flex-col gap-3">
            {/* Search Bar */}
            <SearchInput
              placeholder="Search assets..."
              className="h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search assets"
            />

            {/* Filter Controls */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground font-medium">
                <span className="text-primary">
                  {filteredBalances?.length || 0}
                </span>{" "}
                assets
              </div>
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="hide-zero"
                  className="text-sm font-medium cursor-pointer select-none hover:text-primary transition-colors"
                >
                  Hide zero balances
                </Label>
                <Switch
                  id="hide-zero"
                  checked={hideZeroBalance}
                  onCheckedChange={setHideZeroBalance}
                  className="data-[state=checked]:bg-primary transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assets List */}
      <div className="divide-y">
        {filteredBalances?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in-0">
            <p className="text-muted-foreground">
              {searchQuery
                ? "No assets found matching your search"
                : "No assets available"}
            </p>
          </div>
        ) : (
          <div>
            {filteredBalances?.map((balance, i) => (
              <Query
                key={balance.data?.total.currency.address ?? i}
                query={balance}
                pending={() => <AssetSkeleton />}
              >
                {(data) => (data ? <AssetItem balance={data} /> : null)}
              </Query>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
