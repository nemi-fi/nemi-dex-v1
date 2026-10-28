import { sutils } from "@nemi-fi/utils";

export const currencyListCustom = {
  [sutils.supportedAvmChains.localNetwork.id]: [],
  [sutils.supportedAvmChains.testnet.id]: [],
} satisfies Record<sutils.SupportedAvmChains["id"], unknown>;
