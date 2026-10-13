import { sutils } from "@nemi-fi/utils";
import { assert } from "ts-essentials";
import type { CoreService, LoggerService } from "../sdk.js";

export class DeploymentsService {
  constructor(
    private core: CoreService,
    private logger: LoggerService,
  ) {}

  getSponsoredDeployer = sutils.lazyValue(async () => {
    if (this.#hasPreDeployedAccounts()) {
      const { getInitialTestAccountsData } =
        await import("@aztec/accounts/testing");
      const wallet = await this.core.getTestWallet();

      const index = 0;
      const initialData = (await getInitialTestAccountsData())[index]!;
      // genesis-funded test accounts are initializerless since Aztec v5, and the address
      // only matches the funded one when derived the same way
      const initialManager = await wallet.createSchnorrInitializerlessAccount(
        initialData.secret,
        initialData.salt,
        initialData.signingKey,
      );
      const account = await sutils.registerAccount(initialManager);
      // These accounts are funded at genesis but never published, and being
      // initializerless there is nothing to deploy either, so there is no deployment to
      // assert on. What can go wrong is deriving a different address than the funded one,
      // which is what this catches.
      assert(
        sutils.isAddressEqual(initialManager.address, initialData.address),
        `derived sponsored deployer ${initialManager.address} does not match the genesis-funded account ${initialData.address}`,
      );
      this.logger.log(
        `using local network sponsored deployer ${initialManager.address}`,
      );
      return account;
    }

    this.logger.log("deploying a sponsored deployer...");
    const { faucet } = await import("../core/fee_juice_faucet.ts");
    return await faucet({
      aztecNode: await this.core.aztecNode(),
    });
  });

  async deploySponsoredFpc() {
    const { faucetTo } = await import("../core/fee_juice_faucet.ts");
    const { MySponsoredFeePaymentMethod } = await import("../sponsored_fpc.ts");

    const deployer = await this.getSponsoredDeployer();
    const fpc = await MySponsoredFeePaymentMethod.deploy(deployer);
    await faucetTo({
      to: await fpc.getFeePayer(),
      account: deployer,
      aztecNode: await this.core.aztecNode(),
    });
  }

  #hasPreDeployedAccounts() {
    return this.core.chain.id === sutils.supportedAvmChains.localNetwork.id;
  }
}
