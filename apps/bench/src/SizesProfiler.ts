import { type AztecNode } from "@aztec/aztec.js/node";
import { Gas as AztecGas, GasDimensions } from "@aztec/stdlib/gas";
import { getGasLimits } from "@aztec/wallet-sdk/base-wallet";
import type { EmbeddedWallet } from "@aztec/wallets/embedded";
import { sum } from "lodash-es";
import fs from "node:fs";
import {
  getFnsWithOptions,
  type BenchEntry,
  type BenchEntryInput,
  type Gas,
  type SingleOrArray,
  type SizesProfileReport,
  type SizesProfileResult,
} from "./utils.js";

export class SizesProfiler {
  #results: SizesProfileResult[] = [];
  constructor(
    readonly filename: string,
    readonly wallet: EmbeddedWallet,
    readonly node: AztecNode,
  ) {}

  async profile(fns: SingleOrArray<BenchEntryInput>) {
    const fnsWithOptions = await getFnsWithOptions(fns);
    let results: SizesProfileResult[] = [];
    for (const entry of fnsWithOptions) {
      results.push(await this.#profileOne(entry));
    }
    return results;
  }

  async saveResults() {
    const summary = this.#results.reduce(
      (acc, result) => ({
        ...acc,
        [result.name]: result.totalGateCount,
      }),
      {} as Record<string, number>,
    );
    function sumGas(gas: Gas) {
      return GasDimensions.reduce((acc, dim) => acc + gas[`${dim}Gas`], 0);
    }
    const gasSummary = this.#results.reduce(
      (acc, result) => ({
        ...acc,
        [result.name]:
          sumGas(result.gas.gasLimits) + sumGas(result.gas.teardownGasLimits),
      }),
      {} as Record<string, number>,
    );
    const report: SizesProfileReport = {
      summary,
      results: this.#results,
      gasSummary,
    };
    fs.writeFileSync(this.filename, JSON.stringify(report, null, 2));
  }

  async #profileOne(entry: BenchEntry) {
    const name = entry.options.id;
    console.log(`profiling ${name}...`);
    const { executionSteps } = await entry.f.profile({
      from: entry.from,
      profileMode: "gates",
    });
    const simulationResult = await entry.f.simulate({
      from: entry.from,
      includeMetadata: true,
    });
    await entry.f.send({ from: entry.from });
    const { gasUsed } = simulationResult;
    if (!gasUsed) {
      throw new Error(`no gas estimate for ${name}`);
    }
    // since Aztec v5 `simulate` reports raw usage; turning that into limits is the
    // caller's job and must be clamped to what the network will actually admit
    const { txsLimits } = await this.node.getNodeInfo();
    const estimatedGas = getGasLimits(
      gasUsed,
      AztecGas.from(txsLimits.gas),
      0.1,
    );
    const result: SizesProfileResult = {
      name,
      totalGateCount: sum(executionSteps.map((x) => x.gateCount)),
      gateCounts: executionSteps.map((x) => {
        if (x.gateCount == null) {
          throw new Error(`no gate count for ${x.functionName}`);
        }
        return {
          functionName: x.functionName,
          gateCount: x.gateCount,
        };
      }),
      gas: estimatedGas,
    };
    if (this.#results.find((r) => r.name === result.name)) {
      throw new Error(`already profiled "${result.name}"`);
    }
    this.#results.push(result);
    console.log(`profiled ${result.name}`);
    return result;
  }
}
