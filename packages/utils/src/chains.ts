import type { StrictOmit } from "ts-essentials";

export interface AvmChain {
  readonly id: number;
  readonly name: string;
  readonly proverEnabled: boolean;
  readonly rpcUrls: {
    readonly default: AvmChainRpcUrls;
    readonly [key: string]: AvmChainRpcUrls;
  };
  readonly blockExplorers?: {
    readonly default: AvmChainBlockExplorer;
    readonly [key: string]: AvmChainBlockExplorer;
  };
}

export interface AvmChainRpcUrls {
  readonly http: readonly [string, ...string[]];
}

export interface AvmChainBlockExplorer {
  readonly name: string;
  readonly url: string;
}

type OptionalKeys = "proverEnabled";
function defineAvmChain<
  const T extends StrictOmit<AvmChain, OptionalKeys> &
    Partial<Pick<AvmChain, OptionalKeys>>,
>(chain: T) {
  return {
    ...chain,
    proverEnabled: chain.proverEnabled ?? true,
  };
}

const aztecscanName = "Aztecscan";
export const chains = {
  testnet: defineAvmChain({
    id: 1276970776, // uint32(bytes4(keccak256('aztec-testnet-v6')))
    name: "Aztec Testnet",
    rpcUrls: {
      default: {
        http: [
          "https://lb.drpc.live/aztec-testnet/AhzA6k_e8kYDnLbUfrHiY5FQah5evrwR8breLtu1AWF8",
        ],
      },
    },
    blockExplorers: {
      default: {
        name: aztecscanName,
        url: "https://testnet.aztecscan.xyz",
      },
    },
  }),

  localNetwork: defineAvmChain({
    id: 850140444, // uint32(bytes4(keccak256('aztec-local-network')))
    name: "Aztec Local Network",
    proverEnabled: false,
    rpcUrls: {
      default: {
        http: ["http://localhost:8080"],
      },
    },
    blockExplorers: undefined,
  }),
} as const satisfies Record<string, AvmChain>;
