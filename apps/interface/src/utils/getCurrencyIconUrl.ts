import { sutils } from "@nemi-fi/utils";

// TODO(security): token.symbol is not a trusted source. Can be manipulated by scammers
export function getCurrencyIconUrl(
  currency: Pick<sutils.CurrencyLike, "symbol"> | string,
) {
  const symbol =
    typeof currency === "string" ? currency : (currency.symbol ?? "");
  if (typeof window === "undefined") {
    return "https://nemi.fi";
  }
  return sutils.joinUrl(
    window.location.origin,
    `/api/icons/${symbol.toLowerCase()}`,
  );
}
