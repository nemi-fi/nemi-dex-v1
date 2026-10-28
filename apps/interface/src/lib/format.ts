const usdFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** `1234.5` -> `"$1,234.50"` */
export function formatUsd(value: number): string {
  return `$${usdFormatter.format(value)}`;
}

/** `1234.5` -> `"1.23k"`, `2_500_000` -> `"2.50M"` */
export function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}k`;
  return value.toFixed(2);
}
