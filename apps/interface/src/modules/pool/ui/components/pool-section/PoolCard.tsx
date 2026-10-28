import { Badge } from "#/components/ui/badge.js";
import { Button } from "#/components/ui/button.js";
import { cn } from "#/lib/utils.js";
import { TokenIcon } from "#/components/TokenIcon.js";
import { formatCompact, formatUsd } from "#/lib/format.js";
import { calculatePositionValue, calculateTvl } from "#/lib/prices.js";
import type { interfaceSdk } from "@nemi-fi/interface-sdk";
import { sutils } from "@nemi-fi/utils";
import type { Pool } from "@nemi-fi/v1-sdk";
import type { Currency, CurrencyAmount } from "@uniswap/sdk-core";
import { ChevronDown, ChevronUp, MinusCircle, PlusCircle } from "lucide-react";
import { Link } from "react-router";
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
    "bg-white dark:bg-neutral-800 rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full",
    hasPosition
      ? "border-green-200 dark:border-green-800"
      : "border-gray-200 dark:border-neutral-700",
  );

  const formatReserve = (amount: CurrencyAmount<Currency>) =>
    formatCompact(Number(amount.toExact()));

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
            <div className="font-medium text-sm">{formatUsd(tvl)}</div>
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

        {hasPosition && (
          <div className="mt-4">
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
                    {formatUsd(calculatePositionValue(position))}
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
          </div>
        )}

        {/* Action buttons, pinned to the bottom so they line up across a row */}
        <div className="mt-auto pt-4">
          {hasPosition ? (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                className="flex items-center justify-center gap-1"
                asChild
              >
                <Link
                  to={`/pool/add-liquidity?tokenA=${pool.token0.address}&tokenB=${pool.token1.address}`}
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
                  to={`/pool/remove-liquidity?tokenA=${pool.token0.address}&tokenB=${pool.token1.address}`}
                >
                  <MinusCircle className="h-4 w-4" />
                  Remove
                </Link>
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              className="w-full flex items-center justify-center gap-2"
              asChild
            >
              <Link
                to={`/pool/add-liquidity?tokenA=${pool.token0.address}&tokenB=${pool.token1.address}`}
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
