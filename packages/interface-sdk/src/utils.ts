import type { ContractInstanceWithAddress } from "@aztec-labs/aztec.js/contracts";
import type { Fr } from "@aztec-labs/aztec.js/fields";
import type { AztecNode } from "@aztec-labs/aztec.js/node";
import type { Wallet } from "@aztec-labs/aztec.js/wallet";
import type { EmbeddedWallet } from "@aztec-labs/wallets/embedded";
import type { TokenContract } from "@nemi-fi/contracts/contracts";
import { sutils } from "@nemi-fi/utils";

export async function getSingleKeyAccount(
  wallet: EmbeddedWallet,
  secretKey: Fr,
  alias: string,
) {
  const { Fq, Fr } = await import("@aztec-labs/aztec.js/fields");
  const { poseidon2Hash } =
    await import("@aztec-labs/foundation/crypto/poseidon");

  // Aztec v5 removed the implicit signing key derivation, so it has to be passed in. Derive
  // it from the secret so a given secretKey still maps to a single account.
  const signingKey = Fq.fromBufferReduce(
    (await poseidon2Hash([secretKey])).toBuffer(),
  );

  const salt = new Fr(0); // must be 0 for determinism (same secretKey -> same account)
  const manager = await wallet.createSchnorrInitializerlessAccount(
    secretKey,
    salt,
    signingKey,
    alias,
  );
  return manager;
}

export type Arc20ContractClass = typeof TokenContract;
export type Arc20Contract = Awaited<ReturnType<Arc20ContractClass["at"]>>;

export async function tokenContract(
  token: sutils.AztecAddressable,
  account: Wallet | { wallet: Wallet },
  aztecNode: AztecNode,
): Promise<Arc20Contract> {
  account = "wallet" in account ? account.wallet : account;

  const address = await sutils.resolveAztecAddress(token);
  const instance = await aztecNode.getContract(address);
  if (!instance) {
    throw new Error(`Contract instance for token ${address} not found`);
  }

  const contractClass = await getTokenContractClassByInstance(instance);
  if (!contractClass) {
    throw new Error(`Contract artifact for token ${address} is not supported`);
  }
  await account.registerContract(instance, contractClass.artifact);
  return contractClass.at(instance.address, account);
}

const getSupportedTokenContracts = sutils.lazyValue(async () => {
  const classes: (() => Promise<Arc20ContractClass>)[] = [
    sutils.lazyValue(
      async () => (await import("@nemi-fi/contracts/contracts")).TokenContract,
    ),
    // sutils.lazyValue(async () => {
    //   const { TokenContract } = await import(
    //     "@aztec-labs/noir-contracts.js/Token"
    //   );
    //   return class extends Contract.fromAztec(TokenContract) { };
    // }),
  ];
  return classes.map((getClass) =>
    sutils.lazyValue(async () => {
      const contractClass = await getClass();
      const { getContractClassFromArtifact } =
        await import("@aztec-labs/aztec.js/contracts");
      return {
        jsClass: contractClass,
        onchainClass: await getContractClassFromArtifact(
          contractClass.artifact,
        ),
      };
    }),
  );
});

async function getTokenContractClassByInstance(
  instance: ContractInstanceWithAddress,
) {
  const supportedClasses = await getSupportedTokenContracts();
  for (const getClass of supportedClasses) {
    const contractClass = await getClass();
    if (contractClass.onchainClass.id.equals(instance.currentContractClassId)) {
      return contractClass.jsClass;
    }
  }
}
