import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { calculateUsdValue } from "@/modules/home/ui/components/swap-section/constants";
import { getCurrencyIconUrl } from "@/utils/getCurrencyIconUrl";
import { interfaceSdk } from "@nemi-fi/interface-sdk";
import { sutils } from "@nemi-fi/utils";
import { L2Token, Pool } from "@nemi-fi/v1-sdk";
import { type Currency, CurrencyAmount } from "@uniswap/sdk-core";
import { ChevronDown, ChevronUp, MinusCircle, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface PoolCardProps {
  pool: Pool;
  position?: interfaceSdk.PoolPosition;
}

export function PoolCard({ pool, position }: PoolCardProps) {
  const [positionExpanded, setPositionExpanded] = useState(true);

  // Check if user has an actual position in this pool
  const hasPosition =
    position &&
    (!position.myPooled0.equalTo(0) || !position.myPooled1.equalTo(0));

  // Special styling for owned pools
  const cardClasses = cn(
    "bg-white dark:bg-zinc-800 rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full",
    hasPosition
      ? "border-green-200 dark:border-green-800"
      : "border-gray-200 dark:border-zinc-700",
  );

  // Format reserves with suffixes
  const formatReserve = (amount: any) => {
    if (!amount) return "0";
    try {
      // Handle different types of amount values
      let formattedValue = "0";

      if (amount && typeof amount.toExact === "function") {
        // If it's a Currency.js type with toExact
        formattedValue = amount.toExact();
      } else if (sutils && typeof sutils.displayCurrencyAmount === "function") {
        // Use SDK's display function if available
        formattedValue = sutils.displayCurrencyAmount(amount);
      } else if (amount && typeof amount.toString === "function") {
        // Convert to string if possible
        formattedValue = amount.toString();
      } else if (typeof amount === "string" || typeof amount === "number") {
        // Direct string or number
        formattedValue = amount.toString();
      }

      // Format with suffixes
      const num = parseFloat(formattedValue.replace(/,/g, ""));
      if (isNaN(num)) return "0";
      if (num >= 1000000000) return (num / 1000000000).toFixed(2) + "B";
      if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
      if (num >= 1000) return (num / 1000).toFixed(2) + "k";
      return num.toFixed(2);
    } catch (e) {
      console.error("Error formatting reserve:", e);
      return "0";
    }
  };

  // Calculate TVL using the proper formula
  const tvl = calculateTvl(pool.reserve0, pool.reserve1);
  return (
    <div className={cardClasses}>
      {/* Card header */}
      <div
        className={cn(
          "p-4 flex items-center justify-between",
          hasPosition ? "bg-green-50/60 dark:bg-green-900/10" : "bg-muted/30",
        )}
      >
        <div className="flex items-center">
          <div className="relative">
            <TokenIcon token={pool.token0} size={32} />
            <TokenIcon
              token={pool.token1}
              size={32}
              className="absolute -right-3 -bottom-1 border-2 border-white dark:border-zinc-800"
            />
          </div>
          <div className="ml-8">
            <div className="font-medium flex items-center gap-1">
              <span>{pool.token0.symbol || "?"}</span>
              <span className="text-muted-foreground">/</span>
              <span>{pool.token1.symbol || "?"}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Fee: {sutils.displayPercent(pool.feeTier)}
            </div>
          </div>
        </div>

        {hasPosition && (
          <Badge variant="success" className="ml-auto">
            Your Pool
          </Badge>
        )}
      </div>

      {/* Pool stats */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="grid grid-cols-1 mb-3">
          <div className="bg-muted/30 rounded-lg p-2.5 text-center">
            <div className="text-xs text-muted-foreground mb-1">TVL</div>
            <div className="font-medium text-sm">${formatNumber(tvl)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TokenIcon token={pool.token0} size={18} />
              <span className="text-sm font-medium truncate">
                {pool.token0.symbol}
              </span>
            </div>
            <div className="font-medium">{formatReserve(pool.reserve0)}</div>
          </div>

          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TokenIcon token={pool.token1} size={18} />
              <span className="text-sm font-medium truncate">
                {pool.token1.symbol}
              </span>
            </div>
            <div className="font-medium">{formatReserve(pool.reserve1)}</div>
          </div>
        </div>

        {/* Position section - always take up space even if not visible */}
        <div className="mt-4 flex-1">
          {hasPosition ? (
            <div className="bg-green-50/50 dark:bg-green-900/20 rounded-lg p-3 border border-green-100 dark:border-green-800/30">
              <div className="text-sm text-green-800 dark:text-green-500 font-medium mb-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span>Your Position</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 text-green-700 dark:text-green-400"
                    onClick={() => setPositionExpanded(!positionExpanded)}
                  >
                    {positionExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold">
                    ${formatNumber(calculatePositionValue(position))}
                  </span>
                  <span className="text-xs">
                    {sutils.displayPercent(position.myShare)} of pool
                  </span>
                </div>
              </div>

              {positionExpanded && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <TokenIcon token={pool.token0} size={16} />
                      <span>{pool.token0.symbol}</span>
                    </div>
                    <span className="font-medium">
                      {sutils.displayCurrencyAmount(position.myPooled0)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <TokenIcon token={pool.token1} size={16} />
                      <span>{pool.token1.symbol}</span>
                    </div>
                    <span className="font-medium">
                      {sutils.displayCurrencyAmount(position.myPooled1)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Empty spacer to maintain consistent height
            <div className="min-h-[100px]"></div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-4">
          {hasPosition ? (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="default"
                className="flex items-center justify-center gap-1"
                asChild
              >
                <Link
                  href={`/pool/add-liquidity?tokenA=${pool.token0.address}&tokenB=${pool.token1.address}`}
                >
                  <PlusCircle className="h-4 w-4" />
                  Add
                </Link>
              </Button>
              <Button
                variant="destructive"
                className="flex items-center justify-center gap-1"
                asChild
              >
                <Link
                  href={`/pool/remove-liquidity?tokenA=${pool.token0.address}&tokenB=${pool.token1.address}`}
                >
                  <MinusCircle className="h-4 w-4" />
                  Remove
                </Link>
              </Button>
            </div>
          ) : (
            <Button
              className="w-full flex items-center justify-center gap-2"
              asChild
            >
              <Link
                href={`/pool/add-liquidity?tokenA=${pool.token0.address}&tokenB=${pool.token1.address}`}
              >
                <PlusCircle className="h-4 w-4" />
                Add Liquidity
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Calculate TVL (Total Value Locked) based on reserves and token prices
export function calculateTvl(
  reserveA: CurrencyAmount<L2Token>,
  reserveB: CurrencyAmount<L2Token>,
): number {
  const valueA = calculateUsdValue(reserveA);
  const valueB = calculateUsdValue(reserveB);
  return valueA + valueB;
}

// Calculate user position value in USD
export function calculatePositionValue(
  position: interfaceSdk.PoolPosition,
): number {
  return calculateTvl(position.myPooled0, position.myPooled1);
}

// Format number helper function
export function formatNumber(value: number): string {
  if (value >= 1000000000) return (value / 1000000000).toFixed(2) + "B";
  if (value >= 1000000) return (value / 1000000).toFixed(2) + "M";
  if (value >= 1000) return (value / 1000).toFixed(2) + "k";
  return value.toFixed(2);
}

// Enhanced Token icon component
export const TokenIcon = ({
  token,
  size = 32,
  className = "",
}: {
  token: Currency | null | undefined;
  size?: number;
  className?: string;
}) => {
  // Handle null/undefined tokens
  if (!token) {
    return (
      <div
        className={`rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-gray-400 dark:text-gray-500">?</span>
      </div>
    );
  }

  const symbol = token.symbol || "?";
  const imageUrl = getCurrencyIconUrl(symbol);

  return (
    <div
      className={`rounded-full overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      title={token.name || symbol}
    >
      <img
        src={imageUrl}
        alt={symbol}
        className="w-full h-full object-cover bg-gray-100 dark:bg-zinc-800"
        onError={(e) => {
          // On error, fallback to initial
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          target.src =
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 24 24' fill='none' stroke='%23cccccc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E";
          target.parentElement?.classList.add("bg-gray-100");
          target.parentElement?.classList.add("dark:bg-zinc-800");
        }}
      />
    </div>
  );
};
