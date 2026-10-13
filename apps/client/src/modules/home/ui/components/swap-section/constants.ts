import { sutils } from "@nemi-fi/utils";
import { type Currency, CurrencyAmount } from "@uniswap/sdk-core";

// Token prices in USD
export const TOKEN_PRICES: Record<string, number> = {
  ETH: 1650.75,
  BTC: 85245.32,
  USDC: 1.0,
  USDT: 1.0,
  DAI: 1.0,
  SOL: 163.32,
  // Add more tokens as needed
};

/**
 * @deprecated extract this function into a service that fetches USD prices
 */
export function calculateUsdValue(amount: CurrencyAmount<Currency>) {
  const price = TOKEN_PRICES[amount.currency.symbol ?? ""] || 0;
  return Number(sutils.formatCurrencyAmount(amount)) * price;
}
