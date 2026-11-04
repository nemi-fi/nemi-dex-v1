import { formatUsd } from "#/lib/format.js";
import { useUsdValue } from "#/lib/prices.js";
import type { Currency, CurrencyAmount } from "@uniswap/sdk-core";

/** USD value of a token amount, shown under an amount field. Renders nothing until priced. */
export function UsdValueDisplay({
  amount,
}: {
  amount: CurrencyAmount<Currency> | undefined;
}) {
  const { calculateUsdValue } = useUsdValue();
  const value = amount ? calculateUsdValue(amount) : undefined;

  if (!value) {
    return null;
  }
  return (
    <div
      className="mt-1.5 px-1 text-sm text-gray-500 dark:text-gray-400"
      aria-live="polite"
    >
      = {formatUsd(value)} USD
    </div>
  );
}
