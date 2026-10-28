import { lib } from "#/lib/sdk.js";
import { useSvelte } from "#/hooks/use-svelte.js";

export function useCurrencies() {
  return useSvelte(() => lib.currencyList.currencies);
}
