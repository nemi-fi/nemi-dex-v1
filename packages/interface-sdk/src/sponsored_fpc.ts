import { AztecAddress } from "@aztec/aztec.js/addresses";
import { getContractInstanceFromInstantiationParams } from "@aztec/aztec.js/contracts";
import { SponsoredFeePaymentMethod } from "@aztec/aztec.js/fee";
import { Fr } from "@aztec/aztec.js/fields";
import type { Wallet } from "@aztec/aztec.js/wallet";
import { SPONSORED_FPC_SALT } from "@aztec/constants";
import { SponsoredFPCContract } from "@aztec/noir-contracts.js/SponsoredFPC";
import { sutils } from "@nemi-fi/utils";
import { assert } from "ts-essentials";
import type { Account } from "./sdk.js";

const SALT = new Fr(SPONSORED_FPC_SALT);

/**
 * A payment method that uses the SponsoredFPCContract to pay the fee unconditionally.
 */
export class MySponsoredFeePaymentMethod extends SponsoredFeePaymentMethod {
  static async preDeployed(wallet: Wallet) {
    const fpc = await preDeployedSponsoredFPC(wallet, SALT);
    assert(fpc, "no pre-deployed SponsoredFPC found");
    return new this(fpc.address);
  }

  static async deploy(account: Account) {
    const fpc = await deploySponsoredFPC(account, SALT);
    return new this(fpc.address);
  }
}

async function deploySponsoredFPC(account: Account, salt: Fr) {
  const preDeployed = await preDeployedSponsoredFPC(account.wallet, salt);
  if (preDeployed) {
    return preDeployed;
  }

  // deploy
  console.log("deploying SponsoredFPC...");
  // since Aztec v5 the salt/deployer are locked in at construction, not at send time
  const { contract } = await SponsoredFPCContract.deploy(account.wallet, {
    salt,
    universalDeploy: true,
  }).send({
    from: account.address,
    wait: { timeout: sutils.AZTEC_TX_WAIT_TIMEOUT },
  });
  return contract;
}

async function preDeployedSponsoredFPC(wallet: Wallet, salt: Fr) {
  const instance = await getContractInstanceFromInstantiationParams(
    SponsoredFPCContract.artifact,
    { salt, deployer: AztecAddress.zero() },
  );
  const { isContractPublished } = await wallet.getContractMetadata(
    instance.address,
  );
  if (!isContractPublished) {
    return undefined;
  }

  console.log("found deployed SponsoredFPC at", instance.address.toString());
  await wallet.registerContract(instance, SponsoredFPCContract.artifact);
  return SponsoredFPCContract.at(instance.address, wallet);
}
