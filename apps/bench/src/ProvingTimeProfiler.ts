import { NO_WAIT } from "@aztec-labs/aztec.js/contracts";
import { waitForTx, type AztecNode } from "@aztec-labs/aztec.js/node";
import type { PXE } from "@aztec-labs/pxe/client/lazy";
import type { EmbeddedWallet } from "@aztec-labs/wallets/embedded";
import { sutils } from "@nemi-fi/utils";
import fs from "node:fs";
import {
  getFnsWithOptions,
  type BenchEntry,
  type BenchEntryInput,
  type ProvingTimeProfileReport,
  type ProvingTimeProfileResult,
  type SingleOrArray,
} from "./utils.js";

export class ProvingTimeProfiler {
  #results: ProvingTimeProfileResult[] = [];
  constructor(
    readonly filename: string,
    readonly wallet: EmbeddedWallet,
    readonly node: AztecNode,
  ) {}

  async profile(fns: SingleOrArray<BenchEntryInput>) {
    const fnsWithOptions = await getFnsWithOptions(fns);
    let results: ProvingTimeProfileResult[] = [];
    await withProving(this.wallet, async () => {
      for (const entry of fnsWithOptions) {
        results.push(await this.#profileOne(entry));
      }
    });
    return results;
  }

  async saveResults() {
    const summary = this.#results.reduce(
      (acc, x) => {
        acc[x.name] = x.sendTime;
        return acc;
      },
      {} as Record<string, number>,
    );
    const report: ProvingTimeProfileReport = {
      summary,
      results: this.#results,
    };
    fs.writeFileSync(this.filename, JSON.stringify(report, null, 2));
  }

  async #profileOne(entry: BenchEntry) {
    const name = entry.options.id;
    console.log(`profiling ${name}...`);

    let start = Date.now();
    const { txHash } = await entry.f.send({
      from: entry.from,
      wait: NO_WAIT,
    });
    const sendTime = Date.now() - start;

    await waitForTx(this.node, txHash, {
      timeout: sutils.AZTEC_TX_WAIT_TIMEOUT,
    });

    const result: ProvingTimeProfileResult = {
      name,
      sendTime,
    };
    if (this.#results.find((r) => r.name === result.name)) {
      throw new Error(`already profiled "${result.name}"`);
    }
    this.#results.push(result);
    console.log(`profiled ${result.name}`);
    return result;
  }
}

let proverCounter = 0;
async function withProving(
  wallet: EmbeddedWallet,
  f: () => Promise<void>,
): Promise<void> {
  const pxe: PXE = await (wallet as any).pxe;
  // assumes browser PXE
  if (!("proverEnabled" in pxe)) {
    throw new Error("PXE does not support proving toggling");
  }
  const pxeWithFlag = pxe as unknown as { proverEnabled: boolean };
  pxeWithFlag.proverEnabled = true;
  proverCounter++;
  try {
    await f();
  } finally {
    proverCounter--;
    pxeWithFlag.proverEnabled = proverCounter > 0;
  }
}
