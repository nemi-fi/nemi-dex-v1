import { interfaceSdk } from "@nemi-fi/interface-sdk";
import { sutils } from "@nemi-fi/utils";
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

const defaultChainName = "testnet";
const aztec = new interfaceSdk.AztecService("chainName-v4", defaultChainName);

export const lib = {
  ...createLib(aztec),
  aztec,
};
