import type { ContractInstanceWithAddress } from "@aztec/aztec.js/contracts";
import type { AztecNode } from "@aztec/aztec.js/node";
import type { Wallet } from "@aztec/aztec.js/wallet";
import type { TokenContract } from "@nemi-fi/contracts/contracts";
import { sutils } from "@nemi-fi/utils";

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
      async () => (await import("./contracts.ts")).TokenContract,
    ),
    // sutils.lazyValue(async () => {
    //   const { TokenContract } = await import(
    //     "@aztec/noir-contracts.js/Token"
    //   );
    //   return class extends Contract.fromAztec(TokenContract) { };
    // }),
  ];
  return classes.map((getClass) =>
    sutils.lazyValue(async () => {
      const contractClass = await getClass();
      const { getContractClassFromArtifact } =
        await import("@aztec/aztec.js/contracts");
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
