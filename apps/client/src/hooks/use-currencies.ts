import { lib } from "@/lib/sdk";
import { useSvelte } from "@/hooks/use-svelte";

export function useCurrencies() {
  return useSvelte(() => lib.currencyList.currencies);
}
