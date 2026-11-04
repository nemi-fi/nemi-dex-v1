import { interfaceSdk } from "@nemi-fi/interface-sdk";
import { sutils } from "@nemi-fi/utils";
import { CHAIN_STORAGE_KEY, defaultChainName } from "./chain-name.js";
import { toast } from "./toast.js";

export function createLib({ chain }: { chain: sutils.SupportedAvmChains }) {
  const coreSdk = interfaceSdk.createCore({ chain }, toast);
  const walletSdk = interfaceSdk.createWallet(coreSdk);
  const dexSdk = interfaceSdk.createDex(coreSdk);

  return {
    ...coreSdk,
    ...walletSdk,
    ...dexSdk,
    toast,
  };
}

// staging and preview deploys set VITE_AZTEC_CHAIN=testnet (see lib/chain-name.ts)
const aztec = new interfaceSdk.AztecService(
  CHAIN_STORAGE_KEY,
  defaultChainName(),
);

export const lib = {
  ...createLib(aztec),
  aztec,
};
