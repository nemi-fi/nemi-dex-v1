import type { AztecAddress } from "@aztec/aztec.js/addresses";

export type AztecAddressable =
  | string
  | AztecAddress
  | {
      // import("aztec.js").Contract | L2Token
      address: string | AztecAddress;
    }
  | {
      // import("aztec.js").Wallet
      getAddress(): AztecAddress;
    };

export type CurrencyLike = {
  readonly address: string;
  readonly symbol?: string;
};
