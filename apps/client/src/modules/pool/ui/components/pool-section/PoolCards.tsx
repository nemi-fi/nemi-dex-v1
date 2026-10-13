import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccount } from "@/hooks/use-account";
import { usePoolPositions, usePools } from "@/lib/queries";
import { getCurrencyIconUrl } from "@/utils/getCurrencyIconUrl";
import { interfaceSdk } from "@nemi-fi/interface-sdk";
import type { Pool } from "@nemi-fi/v1-sdk";
import { compact, times, uniqBy } from "lodash-es";
import { Filter, LayoutGrid, List, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { PoolCard } from "./PoolCard";

// Main component
export const PoolCards = () => {
  const account = useAccount();
  const pools = usePools();
  const allPositions = usePoolPositions(pools.data, account);
  const myPositions = allPositions.data?.filter(
    (position) => !position.lpBalance.equalTo(0),
  );
  const [activeTab, setActiveTab] = useState("all-pools");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [tokenFilter, setTokenFilter] = useState("");
  const [showTokenFilter, setShowTokenFilter] = useState(false);

  const uniqueTokens = uniqBy(
    compact(pools.data?.flatMap((p) => [p.token0, p.token1])),
    (token) => token.address.toLowerCase(),
  );

  // Filter pools based on search term, token filter, and active tab
  const filteredPositions = useMemo(() => {
    const positions =
      (activeTab === "my-pools"
        ? myPositions?.map((pos) => ({ pool: pos.pool, position: pos }))
        : pools.data?.map((pool) => ({ pool, position: undefined }))) ?? [];
    return positions.filter(({ pool }) => {
      // Apply text search filter
      const matchesSearch =
        !searchTerm ||
        [
          pool.token0.symbol,
          pool.token1.symbol,
          pool.token0.name,
          pool.token1.name,
          `${pool.token0.symbol}/${pool.token1.symbol}`,
        ].some((text) =>
          text?.toLowerCase().includes(searchTerm.toLowerCase()),
        );

      // Apply token filter
      const matchesToken =
        !tokenFilter ||
        pool.token0.symbol === tokenFilter ||
        pool.token1.symbol === tokenFilter;

      return matchesSearch && matchesToken;
    });
  }, [activeTab, myPositions, pools.data, searchTerm, tokenFilter]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setTokenFilter("");
  };
  return (
    <div className="w-full space-y-4">
      {/* Top section with tabs and search */}
      <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-3 sm:p-4">
        {/* Tabs */}
        <div className="flex w-full">
          <div className="w-full grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("all-pools")}
              className={`rounded-md flex justify-center items-center gap-2 ${
                activeTab === "all-pools"
                  ? "bg-white dark:bg-zinc-700 shadow-sm"
                  : ""
              }`}
            >
              All Pools
              <Badge variant="secondary" className="ml-1">
                {pools.isLoading ? "Loading..." : (pools.data?.length ?? 0)}
              </Badge>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("my-pools")}
              className={`rounded-md flex justify-center items-center gap-2 ${
                activeTab === "my-pools"
                  ? "bg-white dark:bg-zinc-700 shadow-sm"
                  : ""
              }`}
            >
              My Pools
              <Badge variant="secondary" className="ml-1">
                {!myPositions ? "Loading..." : myPositions.length}
              </Badge>
            </Button>
          </div>
        </div>

        {/* Search with view options */}
        <div className="mt-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by token or pool name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 py-2 w-full bg-muted/40"
            />
            {searchTerm || tokenFilter ? (
              <button
                aria-label="Clear filters"
                title="Clear all filters"
                onClick={clearFilters}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                {/* <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={refreshPools}
                  title="Refresh pools"
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
                  />
                </Button> */}
              </div>
            )}
          </div>

          {/* Filter options */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Token filter */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="h-8 flex items-center gap-1.5"
                onClick={() => setShowTokenFilter(!showTokenFilter)}
              >
                <Filter className="h-3.5 w-3.5" />
                {tokenFilter ? (
                  <span className="max-w-[120px] truncate">
                    Filter: {tokenFilter}
                  </span>
                ) : (
                  <span>Filter by token</span>
                )}
              </Button>

              {/* Token filter dropdown */}
              {showTokenFilter && (
                <div className="absolute z-50 mt-1 left-0 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-lg rounded-lg p-2 min-w-[200px] max-h-[250px] overflow-y-auto">
                  <div className="sticky top-0 bg-white dark:bg-zinc-800 pb-1 mb-1 border-b border-gray-100 dark:border-zinc-700">
                    <Input
                      type="text"
                      placeholder="Search tokens..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    {uniqueTokens
                      .filter(
                        (token) =>
                          !searchTerm ||
                          token.symbol
                            ?.toLowerCase()
                            .includes(searchTerm.toLowerCase()),
                      )
                      .map((token) => (
                        <Button
                          key={token.address}
                          variant="ghost"
                          size="sm"
                          className={`w-full justify-start text-xs h-7 ${tokenFilter === token.symbol ? "bg-muted" : ""}`}
                          onClick={() => {
                            setTokenFilter(
                              tokenFilter === token.symbol
                                ? ""
                                : (token.symbol ?? ""),
                            );
                            setShowTokenFilter(false);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 relative">
                              <img
                                src={getCurrencyIconUrl(token)}
                                alt={token.symbol}
                                className="w-full h-full rounded-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src =
                                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 24 24' fill='none' stroke='%23cccccc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E";
                                }}
                              />
                            </div>
                            {token.symbol}
                          </div>
                        </Button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Active filters display */}
            {tokenFilter && (
              <Badge
                variant="outline"
                className="bg-muted/50 h-8 flex items-center gap-1 pl-2 pr-1"
              >
                <span className="text-xs">{tokenFilter}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-1 hover:bg-transparent"
                  onClick={() => setTokenFilter("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            {/* re-enable once we have a list view */}
            {/* <div className="hidden sm:flex ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
                title={`Switch to ${viewMode === "grid" ? "list" : "grid"} view`}
                className="px-2 h-8"
              >
                {viewMode === "grid" ? (
                  <>
                    <List className="h-3.5 w-3.5 mr-2" /> List
                  </>
                ) : (
                  <>
                    <LayoutGrid className="h-3.5 w-3.5 mr-2" /> Grid
                  </>
                )}
              </Button>
            </div> */}
          </div>
        </div>
      </div>

      {/* Mobile view mode toggle */}
      <div className="sm:hidden flex justify-end items-center px-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          title={`Switch to ${viewMode === "grid" ? "list" : "grid"} view`}
          className="h-7 w-7"
        >
          {viewMode === "grid" ? (
            <List className="h-3.5 w-3.5" />
          ) : (
            <LayoutGrid className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {pools.isLoading &&
          times(6, (index) => <PoolCardSkeleton key={index} />)}
      </div>
      <PoolDisplay
        positions={filteredPositions}
        viewMode={viewMode}
        isUserTab={activeTab === "my-pools"}
        account={account}
      />
    </div>
  );
};

function PoolCardSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700 overflow-hidden">
      {/* Card header */}
      <div className="p-4 bg-muted/30 flex items-center">
        <div className="flex items-center">
          <div className="relative">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full absolute -right-3 -bottom-1" />
          </div>
          <div className="ml-8">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-16 mt-1" />
          </div>
        </div>
      </div>

      {/* Pool stats */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>

        <div className="mt-4">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

// // Error state component
// const PoolErrorState = ({
//   error,
//   onRetry,
// }: {
//   error: string;
//   onRetry: () => void;
// }) => (
//   <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 p-8 rounded-xl my-4 text-center shadow-sm">
//     <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
//     <p className="text-red-600/90 dark:text-red-400/90 mb-5 text-lg">{error}</p>
//     <p className="text-muted-foreground mb-6">
//       There was a problem loading the pool data. Please try again.
//     </p>
//     <Button onClick={onRetry} className="px-6">
//       Retry
//     </Button>
//   </div>
// );

// Pool display component (combines grid and list views)
const PoolDisplay = ({
  positions,
  viewMode,
  isUserTab,
  account,
}: {
  positions: { pool: Pool; position?: interfaceSdk.PoolPosition }[];
  viewMode: string;
  isUserTab: boolean;
  account: interfaceSdk.Account | undefined;
}) => {
  // When user is on My Pools tab but not connected
  if (isUserTab && !account) {
    return (
      <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 p-6 rounded-xl text-center shadow-sm">
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-medium mb-3">Connect Your Wallet</h3>
          <p className="text-muted-foreground mb-5">
            Connect your wallet to view your liquidity positions
          </p>
          <Button size="lg" className="w-full sm:w-auto px-8">
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  // // When no pools found
  // if (positions.length === 0) {
  //   return (
  //     <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 p-6 rounded-xl text-center shadow-sm">
  //       <Info className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
  //       <h3 className="text-lg font-medium mb-2">No Pools Found</h3>
  //       <p className="text-muted-foreground mb-4 max-w-md mx-auto text-sm">
  //         {isUserTab
  //           ? "You don't have any liquidity positions yet."
  //           : "No pools match your current search."}
  //       </p>
  //       <Button className="mt-2" asChild>
  //         <Link href="/pool/add-liquidity">
  //           <Plus className="mr-2 h-4 w-4" /> Add Liquidity
  //         </Link>
  //       </Button>
  //     </div>
  //   );
  // }

  // Grid view
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {positions.map(({ pool, position }) => (
          <PoolCard key={pool.poolId} pool={pool} position={position} />
        ))}
      </div>
    );
  }

  // // List view
  // return (
  //   <div className="border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden">
  //     {/* List header - desktop only */}
  //     <div className="hidden md:flex px-6 py-3 bg-muted/50 text-sm font-medium">
  //       <div className="w-1/3">Pool</div>
  //       <div className="w-1/6 text-center">TVL</div>
  //       <div className="w-1/3 text-center">Reserves</div>
  //       <div className="w-1/12 text-center">Actions</div>
  //     </div>

  //     {/* List items */}
  //     <div className="divide-y divide-gray-100 dark:divide-zinc-800">
  //       {pools.map((poolPosition) => (
  //         <PoolListItem
  //           key={poolPosition.pool.poolId}
  //           poolPosition={poolPosition}
  //           isUserPool={isUserTab}
  //         />
  //       ))}
  //     </div>
  //   </div>
  // );
};
