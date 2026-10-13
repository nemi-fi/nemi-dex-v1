import { Query } from "@/components/Query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useAccount } from "@/hooks/use-account";
import { useBalances } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { calculateUsdValue } from "@/modules/home/ui/components/swap-section/constants";
import { sutils } from "@nemi-fi/utils";
import { L2Token } from "@nemi-fi/v1-sdk";
import { CurrencyAmount } from "@uniswap/sdk-core";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface AssetListProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

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
function AssetItem({ balance }: { balance: CurrencyAmount<L2Token> }) {
  const networkColor = getNetworkColor(balance.currency.symbol || "Unknown");
  const usdValue = calculateUsdValue(balance);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex items-center justify-between py-4 px-4 border-b last:border-b-0 hover:bg-muted/50 dark:hover:bg-gray-800/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br",
            networkColor,
          )}
          aria-hidden="true"
        >
          <Image
            src={`/api/icons/${(balance.currency.symbol || "unknown").toLowerCase()}`}
            alt={`${balance.currency.name || "Unknown Token"} icon`}
            width={20}
            height={20}
            className="h-5 w-5"
          />
        </div>
        <div>
          <div className="font-medium text-base">
            {balance.currency.name || "Unknown Token"}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <span>{sutils.displayCurrencyAmount(balance)}</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-medium text-base">
          ${usdValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}
        </div>
      </div>
    </motion.div>
  );
}

function AssetSkeleton() {
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
    <div className="px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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

export function AssetList({ searchQuery, onSearchChange }: AssetListProps) {
  const account = useAccount();
  const balances = useBalances(account);
  const [hideZeroBalance, setHideZeroBalance] = useState(false);

  const filteredBalances = balances?.filter((x) => {
    if (!x.data) {
      return true;
    }

    const matchesSearch =
      x.data.currency.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      x.data.currency.symbol?.toLowerCase().includes(searchQuery.toLowerCase());

    const hasBalance = !hideZeroBalance || x.data.greaterThan(0);

    return matchesSearch && hasBalance;
  });

  const isLoading = balances?.some((b) => b.isLoading) ?? true;

  return (
    <div>
      {/* Controls Section */}
      {isLoading ? (
        <ControlsSkeleton />
      ) : (
        <div className="py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mb-4">
          <div className="flex flex-col gap-3">
            {/* Search Bar */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Search assets..."
                className="pl-10 pr-4 h-9 w-full transition-all focus:ring-2 focus:ring-primary/20"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                aria-label="Search assets"
              />
            </div>

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
        <AnimatePresence mode="wait">
          {filteredBalances?.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center py-12 px-4 text-center"
            >
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No assets found matching your search"
                  : "No assets available"}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {filteredBalances?.map((balance, i) => (
                <Query
                  key={balance.data?.currency.address ?? i}
                  query={balance}
                  pending={() => <AssetSkeleton />}
                >
                  {(data) => (data ? <AssetItem balance={data} /> : null)}
                </Query>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
