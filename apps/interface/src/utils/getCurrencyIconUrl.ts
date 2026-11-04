import type { sutils } from "@nemi-fi/utils";

/** Icons hosted in `public/images/tokens`, keyed by lowercase token symbol */
const iconFileBySymbol: Record<string, string> = {
  usdc: "usdc.png",
  cusdc: "usdc.png",
  weth: "weth.png",
  cweth: "weth.png",
  eth: "eth.png",
  dai: "dai.png",
  btc: "btc.png",
  aave: "aave.png",
  uni: "uni.png",
  sol: "sol.png",
};

/** Returns `undefined` for tokens without a hosted icon */
// TODO(security): token.symbol is not a trusted source. Can be manipulated by scammers
export function getCurrencyIconUrl(
  currency: Pick<sutils.CurrencyLike, "symbol"> | string,
): string | undefined {
  const symbol =
    typeof currency === "string" ? currency : (currency.symbol ?? "");
  const key = symbol.toLowerCase();
  const file = Object.hasOwn(iconFileBySymbol, key)
    ? iconFileBySymbol[key]
    : undefined;
  return file ? `/images/tokens/${file}` : undefined;
}
