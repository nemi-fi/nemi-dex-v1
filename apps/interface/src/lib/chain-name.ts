/**
 * Which Aztec chain the app talks to, without loading the SDK: the badge in the header needs it on
 * every page, the SDK only on app pages. `lib/sdk.ts` uses the same key and default.
 */

/** localStorage key where the chosen chain is persisted (as JSON) by the SDK's AztecService. */
export const CHAIN_STORAGE_KEY = "chainName-v5";

const CHAIN_NAMES = ["mainnet", "testnet", "localNetwork"] as const;
type ChainName = (typeof CHAIN_NAMES)[number];

const isChainName = (value: unknown): value is ChainName =>
  CHAIN_NAMES.includes(value as ChainName);

/** Staging and preview deploys set VITE_AZTEC_CHAIN=testnet; localhost defaults to testnet. */
export function defaultChainName(): ChainName {
  const fromEnv: unknown = import.meta.env.VITE_AZTEC_CHAIN;
  if (isChainName(fromEnv)) return fromEnv;
  const isLocalhost =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname);
  return isLocalhost ? "testnet" : "mainnet";
}

/** The chain currently selected in this browser (browser only). */
export function currentChainName(): ChainName {
  try {
    const stored: unknown = JSON.parse(
      window.localStorage.getItem(CHAIN_STORAGE_KEY) ?? "null",
    );
    if (isChainName(stored)) return stored;
  } catch {
    // unreadable storage: fall back to the default
  }
  return defaultChainName();
}
