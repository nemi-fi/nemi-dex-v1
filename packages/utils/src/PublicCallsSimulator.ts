import type { FunctionCall } from "@aztec-labs/aztec.js/abi";
import type { ContractFunctionInteraction } from "@aztec-labs/aztec.js/contracts";
import type { Fr } from "@aztec-labs/aztec.js/fields";
import type { AztecNode } from "@aztec-labs/aztec.js/node";
import { lazyValue } from "./utils.js";

/**
 * Simulates public calls directly on the node, bypassing the wallet/PXE entirely.
 *
 * `interaction.simulate()` goes through the wallet, which (for `EmbeddedWallet`) syncs the PXE,
 * computes fee options and resolves an account before it reaches the node. Reading public state
 * needs none of that, so this calls `node.simulatePublicCalls` straight away.
 */
export class PublicCallsSimulator {
  constructor(private aztecNode: AztecNode) {}

  async simulatePublic(interaction: ContractFunctionInteraction) {
    const { decodeFromAbi } = await import("@aztec-labs/aztec.js/abi");

    const call = await interaction.getFunctionCall();
    const results = await this.simulatePublicCalls([call]);

    // grab the first result as we simulated only one call
    if (results.length !== 1) {
      throw new Error(`invalid results length: ${results.length}`);
    }
    return call.returnType
      ? decodeFromAbi(call.returnType, results[0]!)
      : undefined;
  }

  async simulatePublicCalls(calls: FunctionCall[]): Promise<Fr[][]> {
    // avoid unnecessary calls to node
    if (calls.length === 0) {
      return [];
    }

    const { FunctionType } = await import("@aztec-labs/aztec.js/abi");
    for (const call of calls) {
      if (call.type !== FunctionType.PUBLIC) {
        throw new Error(
          `tried to simulate a non-public call: ${call.name} - ${call.type}`,
        );
      }
    }

    const { simulateViaNode } =
      await import("@aztec-labs/wallet-sdk/base-wallet");
    const { AztecAddress } = await import("@aztec-labs/aztec.js/addresses");
    const { GasSettings } = await import("@aztec-labs/stdlib/gas");

    const [chainInfo, blockData, minFees] = await Promise.all([
      this.#chainInfo(),
      this.aztecNode.getBlockData("latest"),
      this.aztecNode.getCurrentMinFees(),
    ]);
    if (!blockData) {
      throw new Error("latest block not found");
    }
    const gasSettings = GasSettings.forEstimation({
      maxFeesPerGas: minFees.mul(2),
    });

    const results = await simulateViaNode(
      this.aztecNode,
      calls,
      AztecAddress.zero(),
      chainInfo,
      gasSettings,
      blockData.header,
      true, // skipFeeEnforcement
      async () => undefined,
    );
    return results.flatMap(
      (result) =>
        result.publicOutput?.publicReturnValues.map((x) => x.values ?? []) ??
        [],
    );
  }

  #chainInfo = lazyValue(async () => {
    const { Fr } = await import("@aztec-labs/aztec.js/fields");
    const { l1ChainId, rollupVersion } = await this.aztecNode.getNodeInfo();
    return { chainId: new Fr(l1ChainId), version: new Fr(rollupVersion) };
  });
}
