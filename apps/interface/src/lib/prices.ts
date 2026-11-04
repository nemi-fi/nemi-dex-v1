import type { interfaceSdk } from "@nemi-fi/interface-sdk";
import { sutils } from "@nemi-fi/utils";
import { useQuery } from "@tanstack/react-query";
import type { Currency, CurrencyAmount } from "@uniswap/sdk-core";
import ms from "ms";
import { useCallback } from "react";
import { z } from "zod";

/**
 * Coinbase's public exchange rates: one request returns every listed asset, keyed by
 * symbol, with no API key, and it allows cross-origin requests from the browser.
 * Each rate is how many units of the asset one USD buys, so the USD price is `1 / rate`.
 */
const COINBASE_RATES_URL =
  "https://api.coinbase.com/v2/exchange-rates?currency=USD";

const CoinbaseRatesResponseSchema = z.object({
  data: z.object({ rates: z.record(z.string(), z.string()) }),
});

/** USD price per token symbol, e.g. `{ ETH: 2254.16, USDC: 1 }`. */
export type UsdPrices = Record<string, number>;

async function fetchUsdPrices(): Promise<UsdPrices> {
  const response = await fetch(COINBASE_RATES_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch USD prices: HTTP ${response.status}`);
  }
  const json = CoinbaseRatesResponseSchema.parse(await response.json());
  const prices: UsdPrices = {};
  for (const [symbol, rate] of Object.entries(json.data.rates)) {
    const unitsPerUsd = Number(rate);
    if (unitsPerUsd > 0) {
      prices[symbol] = 1 / unitsPerUsd;
    }
  }
  return prices;
}

export function useUsdPrices() {
  return useQuery({
    queryKey: ["usd-prices"],
    queryFn: fetchUsdPrices,
    staleTime: ms("1 min"),
    refetchInterval: ms("1 min"),
  });
}

/**
 * USD price of `symbol`, or `undefined` while prices load or when the symbol is not priced.
 *
 * Prices are matched by symbol, which is fine while every token is a known test token, but a
 * token's symbol is not a trusted source: before mainnet, price by token address instead.
 */
export function getUsdPrice(
  prices: UsdPrices | undefined,
  symbol: string | undefined,
): number | undefined {
  if (!prices || !symbol) return undefined;
  return prices[symbol];
}

function usdValue(
  prices: UsdPrices | undefined,
  amount: CurrencyAmount<Currency>,
): number | undefined {
  const price = getUsdPrice(prices, amount.currency.symbol);
  if (price === undefined) return undefined;
  return Number(sutils.formatCurrencyAmount(amount)) * price;
}

/** Total value locked in a pool, in USD. `undefined` if either token has no price. */
function tvl(
  prices: UsdPrices | undefined,
  reserveA: CurrencyAmount<Currency>,
  reserveB: CurrencyAmount<Currency>,
): number | undefined {
  const valueA = usdValue(prices, reserveA);
  const valueB = usdValue(prices, reserveB);
  if (valueA === undefined || valueB === undefined) return undefined;
  return valueA + valueB;
}

/**
 * Functions that value amounts in USD with the latest prices. Each returns `undefined`
 * while prices load or when a token has no price, so the UI can show "—" instead of "$0".
 */
export function useUsdValue() {
  const { data: prices } = useUsdPrices();

  const calculateUsdValue = useCallback(
    (amount: CurrencyAmount<Currency>) => usdValue(prices, amount),
    [prices],
  );
  const calculateTvl = useCallback(
    (reserveA: CurrencyAmount<Currency>, reserveB: CurrencyAmount<Currency>) =>
      tvl(prices, reserveA, reserveB),
    [prices],
  );
  /** USD value of the user's share of a pool. */
  const calculatePositionValue = useCallback(
    (position: interfaceSdk.PoolPosition) =>
      tvl(prices, position.myPooled0, position.myPooled1),
    [prices],
  );

  return { prices, calculateUsdValue, calculateTvl, calculatePositionValue };
}
