import { TokenIcon } from "#/components/TokenIcon.js";
import { Badge } from "#/components/ui/badge.js";
import { Button } from "#/components/ui/button.js";
import { SearchInput } from "#/components/ui/search-input.js";
import { Skeleton } from "#/components/ui/skeleton.js";
import { useAccount } from "#/hooks/use-account.js";
import { usePoolPositions, usePools } from "#/lib/queries.js";
import { activePillClassName, cn } from "#/lib/utils.js";
import WalletConnect from "#/modules/home/ui/components/wallet-connect/index.js";
import { compact, times, uniqBy } from "lodash-es";
import { Filter, X } from "lucide-react";
import { useMemo, useState } from "react";
import { PoolCard } from "./PoolCard.js";

type Tab = "all-pools" | "my-pools";

const panelClassName =
  "bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl";

export const PoolCards = () => {
  const account = useAccount();
  const pools = usePools();
  const allPositions = usePoolPositions(pools.data, account);
  const myPositions = allPositions.data?.filter(
    (position) => !position.lpBalance.equalTo(0),
  );
  const [activeTab, setActiveTab] = useState<Tab>("all-pools");
  const [searchTerm, setSearchTerm] = useState("");
  const [tokenFilter, setTokenFilter] = useState("");

  // Filter pools based on search term, token filter, and active tab
  const filteredPositions = useMemo(() => {
    const positions =
      (activeTab === "my-pools"
        ? myPositions?.map((pos) => ({ pool: pos.pool, position: pos }))
        : pools.data?.map((pool) => ({ pool, position: undefined }))) ?? [];
    const search = searchTerm.toLowerCase();
    return positions.filter(({ pool }) => {
      const matchesSearch =
        !search ||
        [
          pool.token0.symbol,
          pool.token1.symbol,
          pool.token0.name,
          pool.token1.name,
          `${pool.token0.symbol}/${pool.token1.symbol}`,
        ].some((text) => text?.toLowerCase().includes(search));

      const matchesToken =
        !tokenFilter ||
        pool.token0.symbol === tokenFilter ||
        pool.token1.symbol === tokenFilter;

      return matchesSearch && matchesToken;
    });
  }, [activeTab, myPositions, pools.data, searchTerm, tokenFilter]);

  const tabs: { id: Tab; label: string; count: number | undefined }[] = [
    { id: "all-pools", label: "All Pools", count: pools.data?.length },
    { id: "my-pools", label: "My Pools", count: myPositions?.length },
  ];

  return (
    <div className="w-full space-y-4">
      <div className={cn(panelClassName, "p-3 sm:p-4")}>
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1 dark:bg-neutral-900/60">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md",
                activeTab === tab.id
                  ? cn(
                      activePillClassName,
                      "hover:bg-white dark:hover:bg-neutral-600",
                    )
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              <Badge
                variant="outline"
                className="ml-1 border-transparent bg-gray-100 dark:bg-black/30"
              >
                {tab.count ?? "Loading..."}
              </Badge>
            </Button>
          ))}
        </div>

        <div className="mt-3 space-y-3">
          <SearchInput
            placeholder="Search by token or pool name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm("")}
            aria-label="Search pools"
          />

          <div className="flex flex-wrap items-center gap-2">
            <TokenFilter
              tokens={uniqBy(
                compact(pools.data?.flatMap((p) => [p.token0, p.token1])),
                (token) => token.address.toLowerCase(),
              )}
              value={tokenFilter}
              onChange={setTokenFilter}
            />
          </div>
        </div>
      </div>

      {activeTab === "my-pools" && !account ? (
        <div className={cn(panelClassName, "p-6 text-center shadow-sm")}>
          <div className="mx-auto max-w-md">
            <h3 className="mb-3 text-lg font-medium">Connect Your Wallet</h3>
            <p className="mb-5 text-muted-foreground">
              Connect your wallet to view your liquidity positions
            </p>
            <WalletConnect />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {pools.isLoading
            ? times(6, (index) => <PoolCardSkeleton key={index} />)
            : filteredPositions.map(({ pool, position }) => (
                <PoolCard key={pool.poolId} pool={pool} position={position} />
              ))}
        </div>
      )}
    </div>
  );
};

function TokenFilter({
  tokens,
  value,
  onChange,
}: {
  tokens: { address: { toString(): string }; symbol?: string; name?: string }[];
  value: string;
  onChange: (symbol: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  // Separate from the pool search above so typing here doesn't filter the pool list
  const [query, setQuery] = useState("");

  const matchingTokens = tokens.filter(
    (token) =>
      !query || token.symbol?.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          className="flex h-8 items-center gap-1.5"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
        >
          <Filter className="h-3.5 w-3.5" />
          <span className="max-w-[120px] truncate">
            {value ? `Filter: ${value}` : "Filter by token"}
          </span>
        </Button>

        {isOpen && (
          <div
            className={cn(
              panelClassName,
              "absolute left-0 z-50 mt-1 max-h-[250px] min-w-[200px] overflow-y-auto p-2 shadow-lg",
            )}
          >
            <div className="sticky top-0 mb-1 border-b border-gray-100 bg-white pb-1 dark:border-neutral-700 dark:bg-neutral-800">
              <SearchInput
                placeholder="Search tokens..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-8 text-xs"
                aria-label="Search tokens"
              />
            </div>
            <div className="space-y-1">
              {matchingTokens.map((token) => (
                <Button
                  key={token.address.toString()}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 w-full justify-start gap-2 text-xs",
                    value === token.symbol && "bg-muted",
                  )}
                  onClick={() => {
                    onChange(
                      value === token.symbol ? "" : (token.symbol ?? ""),
                    );
                    setIsOpen(false);
                  }}
                >
                  <TokenIcon token={token} size={16} />
                  {token.symbol}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {value && (
        <Badge
          variant="outline"
          className="flex h-8 items-center gap-1 bg-muted/50 pl-2 pr-1"
        >
          <span className="text-xs">{value}</span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-1 h-5 w-5 hover:bg-transparent"
            onClick={() => onChange("")}
            aria-label="Clear token filter"
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}
    </>
  );
}

function PoolCardSkeleton() {
  return (
    <div className={cn(panelClassName, "overflow-hidden shadow-sm")}>
      <div className="flex items-center bg-muted/30 p-4">
        <div className="relative">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="absolute -bottom-1 -right-3 h-8 w-8 rounded-full" />
        </div>
        <div className="ml-8">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-1 h-3 w-16" />
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3 grid grid-cols-2 gap-2">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
        <Skeleton className="mt-4 h-10 w-full rounded-md" />
      </div>
    </div>
  );
}
