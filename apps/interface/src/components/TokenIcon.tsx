import { cn } from "#/lib/utils.js";
import { getCurrencyIconUrl } from "#/utils/getCurrencyIconUrl.js";
import type { Currency } from "@uniswap/sdk-core";
import { useState } from "react";

/**
 * A token's round logo, falling back to its first letter when the image is missing. Without
 * `size` it fills its parent.
 */
export function TokenIcon({
  token,
  size,
  className,
}: {
  token: Pick<Currency, "symbol" | "name"> | null | undefined;
  size?: number;
  className?: string;
}) {
  const symbol = token?.symbol || "?";
  const src = getCurrencyIconUrl(symbol);
  // Remember which URL failed, so picking another token tries its image again
  const [failedSrc, setFailedSrc] = useState<string>();

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center",
        !size && "h-full w-full",
        "overflow-hidden rounded-full bg-gray-100 text-xs font-medium text-gray-500 dark:bg-neutral-700 dark:text-gray-300",
        className,
      )}
      style={size ? { width: size, height: size } : undefined}
      title={token?.name || symbol}
    >
      {token && failedSrc !== src ? (
        <img
          src={src}
          alt={symbol}
          className="h-full w-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <span aria-hidden="true">{symbol.charAt(0)}</span>
      )}
    </div>
  );
}
