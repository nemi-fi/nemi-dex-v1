import type { AztecAddress } from "@aztec/aztec.js/addresses";
import type { ContractFunctionInteraction } from "@aztec/aztec.js/contracts";
import { waitForNode } from "@aztec/aztec.js/node";
import type { GasDimensions } from "@aztec/stdlib/gas";
import { sutils } from "@nemi-fi/utils";
import { castArray } from "lodash-es";
import { parseUnits } from "viem";

export type SizesProfileReport = {
  readonly summary: Record<string, number>;
  readonly results: readonly SizesProfileResult[];
  readonly gasSummary: Record<string, number>;
};

export type SizesProfileResult = {
  readonly name: string;
  readonly totalGateCount: number;
  readonly gateCounts: readonly {
    readonly functionName: string;
    readonly gateCount: number;
  }[];
  readonly gas: Record<"gasLimits" | "teardownGasLimits", Gas>;
};

export type Gas = Record<`${GasDimensions}Gas`, number>;

export type SingleOrArray<T> = T | readonly T[];

export type ProvingTimeProfileReport = {
  readonly summary: Record<string, number>;
  readonly results: readonly ProvingTimeProfileResult[];
};

export type ProvingTimeProfileResult = {
  readonly name: string;
  readonly sendTime: number;
};

export async function connectToWallet() {
  const aztecNode = await sutils.createAztecNode(sutils.chains.localNetwork);
  await waitForNode(aztecNode);
  const wallet = await sutils.createIsomorphicTestWallet(aztecNode);
  return { wallet, aztecNode };
}

/**
 * Convert the human readable amount to the units of the token.
 */
export function amt(x: bigint | number | string) {
  // TODO: use 18 decimals
  return parseUnits(x.toString(), 9);
}

export interface BenchFnOptionsInput {
  readonly id?: string;
}

export type BenchFnOptions = Required<BenchFnOptionsInput>;

export type BenchEntryInput = {
  from: AztecAddress;
  f: ContractFunctionInteraction;
  options?: BenchFnOptionsInput;
};

export type BenchEntry = Required<BenchEntryInput> & {
  options: BenchFnOptions;
};

export async function getFnsWithOptions(
  fns: SingleOrArray<BenchEntryInput>,
): Promise<BenchEntry[]> {
  return await Promise.all(
    castArray(fns).map(async (params) => ({
      ...params,
      options: {
        ...params.options,
        id: params.options?.id ?? (await params.f.request()).calls[0]!.name,
      },
    })),
  );
}
