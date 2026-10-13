import type { AztecAddress } from "@aztec/aztec.js/addresses";
import type { TxHash } from "@aztec/aztec.js/tx";
import { pick } from "lodash-es";
import type { ValueOf } from "ts-essentials";
import { joinURL } from "ufo";
import { z } from "zod";
import { chains } from "./chains.js";
import { valuesToLiteralUnion } from "./utils.js";

export const appInfo = {
  backendUrl:
    typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:4000"
      : "https://nemi-jt7y.onrender.com",
  discordLink: "https://discord.gg/GBxFNJtz7p",
  telegramLink: "https://t.me/+ZnO6GWopZFgwYThi",
} as const;

const sepoliaRpcUrl =
  "https://eth-sepolia.g.alchemy.com/v2/i8TSkUDiQV0bGsfADW6OK6tyq1Ws5n94";
export const l1RpcUrls: Record<ValueOf<typeof chains>["id"], string> = {
  [chains.testnet.id]: sepoliaRpcUrl,
  [chains.localNetwork.id]: "http://localhost:8545",
};

export const supportedAvmChains = pick(chains, [
  "testnet",
  "localNetwork",
] satisfies (keyof typeof chains)[]);
export type SupportedAvmChains = ValueOf<typeof supportedAvmChains>;

export const SupportedAvmChainIdSchema = valuesToLiteralUnion(
  Object.values(supportedAvmChains).map((chain) => chain.id),
);

export const ChainNameSchema = z.enum(
  Object.keys(supportedAvmChains) as [
    keyof typeof supportedAvmChains,
    ...(keyof typeof supportedAvmChains)[],
  ],
);

export function explorerUrl(chain: SupportedAvmChains) {
  const root = chain.blockExplorers?.default.url;
  return {
    block: (number: number) => (root ? joinURL(root, `/blocks/${number}`) : ""),
    tx: (hash: string | TxHash) =>
      root ? joinURL(root, `/tx-effects/${hash}`) : "",
    address: (address: string | AztecAddress) =>
      root ? joinURL(root, `/contracts/instances/${address}`) : "",
  };
}
