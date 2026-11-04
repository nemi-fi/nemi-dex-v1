import { sutils } from "@nemi-fi/utils";

export const currencyListCustom = {
  [sutils.supportedAvmChains.localNetwork.id]: [],
  [sutils.supportedAvmChains.mainnet.id]: [
    {
      address:
        "0x30112e52178143b74cf6037d047bbba924f4b0db8aab587a340aacfc6ecb4f38",
      decimals: 6,
      symbol: "cUSDC",
      name: "Clean USDC",
    },
    {
      address:
        "0x2a36cedc4f7fa6bd9fbb77ab799737f30d12cd86ffa9d9d63737d51a6e7247fe",
      decimals: 18,
      symbol: "cWETH",
      name: "Clean WETH",
    },
  ],
  [sutils.supportedAvmChains.testnet.id]: [],
} satisfies Record<sutils.SupportedAvmChains["id"], unknown>;
