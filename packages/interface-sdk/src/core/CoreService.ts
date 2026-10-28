import type { CallIntent } from "@aztec-labs/aztec.js/authorization";
import type { Contract } from "@aztec-labs/aztec.js/contracts";
import type { FeePaymentMethod } from "@aztec-labs/aztec.js/fee";
import type { AccountManager, Wallet } from "@aztec-labs/aztec.js/wallet";
import { readDeploymentJsonFiles } from "@nemi-fi/aztec-deploy/client";
import { sutils } from "@nemi-fi/utils";
import { assert } from "ts-essentials";
import type { Account, LoggerService } from "../sdk.js";
import { type IAztecService, type IToastService } from "../types.js";

export class CoreService {
  constructor(
    private aztec: IAztecService,
    private logger: LoggerService,
    private toast: IToastService,
  ) {}

  get chain() {
    return this.aztec.chain;
  }

  async getBlockNumber() {
    return (await this.aztecNode()).getBlockNumber();
  }

  get explorerUrl() {
    return sutils.explorerUrl(this.chain);
  }

  async getDeployments() {
    const deployments = await readDeploymentJsonFiles(
      (await import("../scripts/deploy/deployments-dynamic.json")).default,
      (await import("../scripts/deploy/deployments-static.json")).default,
    );
    return deployments[this.aztec.chain.id];
  }

  aztecNode = sutils.lazyValue(async () => {
    const node = await sutils.createAztecNode(this.aztec.chain);
    if (this.#isLocalNetwork()) {
      const { waitForNode } = await import("@aztec-labs/aztec.js/node");
      this.logger.log("waiting for node...");
      await waitForNode(node);
      this.logger.log("waited for node");
    }
    return node;
  });

  async ensureAccountDeployed(accountManager: AccountManager) {
    return await sutils.ensureAccountDeployed(
      accountManager,
      await this.aztecNode(),
      await this.getSponsoredFeePaymentMethod(),
      this.toast,
    );
  }

  // TODO(security): remove this as it can be accidentally used to receive funds
  getReadonlyAccount = sutils.lazyValue(async () => {
    const { Fq, Fr } = await import("@aztec-labs/aztec.js/fields");
    const wallet = await this.getTestWallet();
    const manager = await wallet.createSchnorrAccount(
      new Fr(123),
      new Fr(0), //salt
      new Fq(123), // signing key, explicit since Aztec v5
    );
    const account = await this.ensureAccountDeployed(manager);

    // TODO
    // account.sendTransaction = (): never => {
    //   throw new Error("tried to send a tx from a read-only account");
    // };

    this.logger.log("using read-only account", account.address.toString());
    return account;
  });

  getSponsoredFeePaymentMethod = sutils.lazyValue(async () => {
    const { MySponsoredFeePaymentMethod } = await import("../sponsored_fpc.ts");
    return await MySponsoredFeePaymentMethod.preDeployed(
      await this.getTestWallet(),
    );
  });

  /**
   * Fee payment method for a transaction sent from `wallet`. The sponsored FPC only exists on
   * testnet/localnetwork and is meant for the embedded wallet, so it is used only for that
   * wallet. External wallets get `undefined` and pay their own fees.
   */
  async getSponsoredFeePaymentMethodFor(
    wallet: Wallet | undefined,
  ): Promise<FeePaymentMethod | undefined> {
    if (wallet !== (await this.getTestWallet())) {
      return undefined;
    }
    return await this.getSponsoredFeePaymentMethod();
  }

  /**
   * TODO(security): is it safe to use TestWallet in mainnet code?
   * @deprecated
   */
  getTestWallet = sutils.lazyValue(async () => {
    return await sutils.createIsomorphicTestWallet(await this.aztecNode());
  });

  /**
   * needed because Wallet does not support batching contract registration
   */
  async registerContracts(wallet: Wallet, contracts: Contract[]) {
    const aztecNode = await this.aztecNode();
    await Promise.all(
      contracts.map(async (contract) => {
        const instance = await aztecNode.getContract(contract.address);
        assert(
          instance,
          `Contract instance not found for contract ${contract.address}`,
        );
        await wallet.registerContract(instance, contract.artifact);
      }),
    );
  }

  /**
   * needed because Wallet does not support batching auth witnesses
   */
  async createAuthWits(
    account: Pick<Account, "wallet" | "address">,
    intents: CallIntent[],
  ) {
    return await Promise.all(
      intents.map(async (intent) => {
        return await account.wallet.createAuthWit(account.address, intent);
      }),
    );
  }

  #isLocalNetwork() {
    return this.chain.id === sutils.supportedAvmChains.localNetwork.id;
  }
}
