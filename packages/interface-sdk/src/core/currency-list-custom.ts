import { sutils } from "@nemi-fi/utils";

export const currencyListCustom = {
  [sutils.supportedAvmChains.localNetwork.id]: [],
  [sutils.supportedAvmChains.testnet.id]: [
    {
      address:
        "0x11a748929f8534259b531f742a0c60e067def53aa6cfe7952a6ce7e9ef1f511f",
      decimals: 6,
      symbol: "cUSDC",
      name: "Shield cUSDC",
    },
  ],
} satisfies Record<sutils.SupportedAvmChains["id"], unknown>;
