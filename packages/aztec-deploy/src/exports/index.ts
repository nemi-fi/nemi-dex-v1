import { getAllFunctionAbis, type ContractArtifact } from "@aztec/aztec.js/abi";
import type { AztecAddress } from "@aztec/aztec.js/addresses";
import type {
  Contract as AztecContract,
  ContractInstanceWithAddress,
  DeployMethod,
} from "@aztec/aztec.js/contracts";
import type { PublicKeys } from "@aztec/aztec.js/keys";
import { createAztecNodeClient, type AztecNode } from "@aztec/aztec.js/node";
import type { Wallet } from "@aztec/aztec.js/wallet";
import {
  computeInitializationHash,
  ContractInstanceWithAddressSchema,
  getContractClassFromArtifact,
} from "@aztec/stdlib/contract";
import { sutils } from "@nemi-fi/utils";
import stringify from "json-stringify-deterministic";
import { clone, mapValues } from "lodash-es";
import fs from "node:fs";
import path from "node:path";
import { assert, UnreachableCaseError } from "ts-essentials";
import { z } from "zod";
import { readDeploymentJsonFiles } from "./client.js";

type ModuleResultLike = Record<string, ContractDeploymentFuture<any>>;

export class AztecDeployModule<T extends ModuleResultLike> {
  readonly #storage: DeploymentsStorage;
  readonly #futures: Future[] = [];
  readonly #built: T;

  constructor(
    dirname: string,
    private chain: sutils.AvmChain,
    readonly deployer: WalletAccount,
    moduleBuilder: (module: AztecDeployModule<T>) => T,
  ) {
    this.#storage = new DeploymentsStorage(dirname, chain);
    this.#built = moduleBuilder(this);
  }

  contract<C extends AztecContract, M extends keyof C["methods"] & string>(
    contractClass: ContractClassLike<C>,
    method: M,
    args: Parameters<C["methods"][M]>,
    options: { id?: string } = {},
  ) {
    const name =
      options.id ??
      (contractClass.artifact.name.endsWith("Contract")
        ? contractClass.artifact.name.slice(0, -"Contract".length)
        : contractClass.artifact.name);
    return this.#addFuture(
      new ContractDeploymentFuture(
        this.chain,
        this.#storage,
        name,
        this.deployer,
        contractClass,
        method,
        args,
      ),
    );
  }

  call<C extends AztecContract, M extends keyof C["methods"] & string>(
    contractFuture: ContractDeploymentFuture<C>,
    methodName: M,
    args: Parameters<C["methods"][M]>,
  ) {
    return this.#addFuture(
      new ContractExecuteFuture(contractFuture, methodName, args),
    );
  }

  async _internalFinish() {
    for (const future of this.#futures) {
      await future.finish();
    }
    return await sutils.promiseAllObject(
      mapValues(this.#built, (c) => c.wait()),
    );
  }

  async _internalVisualize() {
    const logs: string[] = [];
    const check = "✅";
    const cross = "❌";
    for (const future of this.#futures) {
      if (future instanceof ContractDeploymentFuture) {
        const shouldRedeploy = await future.shouldRedeploy();
        if (shouldRedeploy.shouldRedeploy) {
          logs.push(
            `${cross} ${future.name} will be redeployed: ${shouldRedeploy.reason}`,
          );
        } else {
          logs.push(`${check} ${future.name} will not be redeployed`);
        }
      } else if (future instanceof ContractExecuteFuture) {
        const shouldExecute = await future.shouldExecute();
        if (shouldExecute) {
          logs.push(
            `${check} ${future.contractFuture.name}.${future.methodName}(${JSON.stringify(future.args)}) will be executed`,
          );
        } else {
          logs.push(
            `${cross} ${future.contractFuture.name}.${future.methodName} will not be executed`,
          );
        }
      } else {
        throw new UnreachableCaseError(future);
      }
    }
    return logs;
  }

  #addFuture<T extends Future>(future: T): T {
    this.#futures.push(future);
    return future;
  }
}

type ModuleFn<T extends ModuleResultLike> = (
  dirname: string,
  chain: sutils.AvmChain,
  deployer: WalletAccount,
) => AztecDeployModule<T>;

export function buildModule<T extends ModuleResultLike>(
  moduleBuilder: (module: AztecDeployModule<T>) => T,
) {
  return (dirname: string, chain: sutils.AvmChain, deployer: WalletAccount) =>
    new AztecDeployModule<T>(dirname, chain, deployer, moduleBuilder);
}

export class AztecDeploy {
  constructor(
    private dirname: string,
    private chain: sutils.AvmChain,
    private deployer: WalletAccount,
  ) {}

  async deploy<T extends ModuleResultLike>(
    moduleFn: ModuleFn<T>,
  ): Promise<{
    [K in keyof T]: Awaited<ReturnType<T[K]["finish"]>>["contract"];
  }> {
    const module = this.#resolveModuleFn(moduleFn);
    return await module._internalFinish();
  }

  async visualize(moduleFn: ModuleFn<any>) {
    const module = this.#resolveModuleFn(moduleFn);
    return await module._internalVisualize();
  }

  #resolveModuleFn<T extends ModuleResultLike>(moduleFn: ModuleFn<T>) {
    return moduleFn(this.dirname, this.chain, this.deployer);
  }
}

export type Future = ContractDeploymentFuture<any> | ContractExecuteFuture;

export class ContractDeploymentFuture<C extends AztecContract> {
  #deployPromise = sutils.promiseWithResolvers<C>();
  #node: AztecNode;

  constructor(
    private chain: sutils.AvmChain,
    private storage: DeploymentsStorage,
    readonly name: string,
    private deployer: WalletAccount,
    private contractClass: ContractClassLike<C>,
    private method: string,
    private args: unknown[],
  ) {
    this.#node = createAztecNodeClient(this.chain.rpcUrls.default.http[0]);
  }

  getDeployerAddress(): AztecAddress {
    return this.deployer.address;
  }

  async finish() {
    try {
      const result = await this.#deploy();
      this.#deployPromise.resolve(result.contract);
      return result;
    } catch (error) {
      this.#deployPromise.reject(error);
      throw error;
    }
  }

  async #deploy() {
    const redeployInfo = await this.shouldRedeploy();
    if (!redeployInfo.shouldRedeploy) {
      console.log(
        `Contract ${this.name} already deployed at ${redeployInfo.savedDeployment.address}`,
      );
      return {
        newlyDeployed: false,
        contract: await this.contractClass.at(
          redeployInfo.savedDeployment.address,
          this.deployer.wallet,
        ),
      };
    }

    console.log(`Deploying contract ${this.name}: ${redeployInfo.reason}`);

    console.log(`Deploying contract ${this.name}...`);
    const { contract, receipt } = await this.contractClass
      .deployWithOpts(
        { wallet: this.deployer.wallet, method: this.method },
        ...(this.args as Parameters<C["methods"][typeof this.method]>),
      )
      .send({
        from: this.deployer.address,
        wait: { timeout: sutils.AZTEC_TX_WAIT_TIMEOUT },
      });
    console.log(`Transaction hash: ${receipt.txHash}`);
    const instance = await this.#node.getContract(contract.address);
    assert(
      instance,
      `contract instance not found for contract ${contract.address}`,
    );
    await this.storage.saveDeployment(this.name, instance);

    console.log(`Deployed contract ${this.name} at ${contract.address}`);

    return {
      newlyDeployed: true,
      contract: await this.contractClass.at(
        contract.address,
        this.deployer.wallet,
      ),
    };
  }

  async shouldRedeploy(): Promise<
    | { shouldRedeploy: true; reason: string }
    | { shouldRedeploy: false; savedDeployment: ContractInstanceWithAddress }
  > {
    if (this.chain.id === sutils.chains.localNetwork.id) {
      return { shouldRedeploy: true, reason: "redeploying for testing" };
    }

    const savedDeployment = await this.storage.getDeployment(this.name);
    if (!savedDeployment) {
      return { shouldRedeploy: true, reason: "not deployed" };
    }

    const aztecContractClass = await getContractClassFromArtifact(
      this.contractClass.artifact,
    );
    if (!savedDeployment.currentContractClassId.equals(aztecContractClass.id)) {
      return {
        shouldRedeploy: true,
        reason: `different contract class id: old: ${savedDeployment.currentContractClassId}, new: ${aztecContractClass.id}`,
      };
    }

    const constructorArtifact = getAllFunctionAbis(
      this.contractClass.artifact,
    ).find((f) => f.name === this.method);
    if (!constructorArtifact) {
      throw new Error(
        `constructor "${this.method}" not found for ${this.name}`,
      );
    }
    const currentInitializationHash = await computeInitializationHash(
      constructorArtifact,
      this.args,
    );
    if (!savedDeployment.initializationHash.equals(currentInitializationHash)) {
      return {
        shouldRedeploy: true,
        reason: `different initialization hash: old: ${savedDeployment.initializationHash}, new: ${currentInitializationHash}`,
      };
    }

    const onChainInstance = await this.#node.getContract(
      savedDeployment.address,
    );
    if (onChainInstance == null) {
      return {
        shouldRedeploy: true,
        reason:
          "contract not found on chain (probably because of a chain re-org)",
      };
    }

    return { shouldRedeploy: false, savedDeployment };
  }

  async wait() {
    return this.#deployPromise.promise;
  }
}

export interface ContractDeploymentResult<C extends AztecContract> {
  newlyDeployed: boolean;
  contract: C;
}

export class ContractExecuteFuture {
  constructor(
    readonly contractFuture: ContractDeploymentFuture<any>,
    readonly methodName: string,
    readonly args: unknown[],
  ) {}

  async finish() {
    const shouldExecute: boolean = await this.shouldExecute();
    if (!shouldExecute) {
      console.log(
        `Skipping execution of ${this.methodName} on ${this.contractFuture.name}`,
      );
      return;
    }

    const contract = await this.contractFuture.wait();

    console.log(
      `Executing ${this.methodName} on ${this.contractFuture.name} with args ${JSON.stringify(this.args)}`,
    );

    const interaction = contract.methods[this.methodName]!(...this.args);

    const { receipt } = await interaction.send({
      from: this.contractFuture.getDeployerAddress(),
      wait: { timeout: sutils.AZTEC_TX_WAIT_TIMEOUT },
    });
    console.log(`Transaction hash: ${receipt.txHash}`);
    console.log(
      `Transaction ${receipt.txHash} confirmed in block ${receipt.blockNumber}`,
    );
  }

  async shouldExecute(): Promise<boolean> {
    // No need to re-execute the same tx the same contract
    return (await this.contractFuture.shouldRedeploy()).shouldRedeploy;
  }
}

type DeploymentsSchema = z.infer<typeof DeploymentsSchema>;
const DeploymentsSchema = z.record(
  z.coerce.number().describe("chain.id"),
  z.record(
    z.string().describe("contract name"),
    ContractInstanceWithAddressSchema,
  ),
);

export class DeploymentsStorage {
  private readonly basePath: string;

  constructor(
    dirname: string,
    private chain: sutils.AvmChain,
  ) {
    this.basePath = path.join(dirname, "deployments");
  }

  async getDeployment(
    contractName: string,
  ): Promise<ContractInstanceWithAddress | undefined> {
    const deployments = await this.#readFile();
    return deployments[this.chain.id]?.[contractName];
  }

  async saveDeployment(
    contractName: string,
    value: ContractInstanceWithAddress,
  ): Promise<void> {
    const deployments = await this.#readFile();
    deployments[this.chain.id] ??= {};
    deployments[this.chain.id]![contractName] = value;
    await this.#writeFile(deployments);
  }

  async removeDeployment(contractName: string): Promise<void> {
    const deployments = await this.#readFile();
    deployments[this.chain.id] ??= {};
    delete deployments[this.chain.id]![contractName];
    await this.#writeFile(deployments);
  }

  async #readFile(): Promise<DeploymentsSchema> {
    const dynamicPath = `${this.basePath}-dynamic.json`;
    const dynamicContent = fs.existsSync(dynamicPath)
      ? JSON.parse(fs.readFileSync(dynamicPath, "utf8"))
      : {};
    const staticPath = `${this.basePath}-static.json`;
    const staticContent = fs.existsSync(staticPath)
      ? JSON.parse(fs.readFileSync(staticPath, "utf8"))
      : {};
    return DeploymentsSchema.parse(
      await readDeploymentJsonFiles(dynamicContent, staticContent),
    );
  }

  async #writeFile(deployments: DeploymentsSchema): Promise<void> {
    writeDeploymentJsonFiles(this.basePath, deployments);
  }
}

export interface ContractClassLike<
  C extends AztecContract,
  M extends keyof C["methods"] = keyof C["methods"],
> {
  deployWithOpts: (
    options: {
      publicKeys?: PublicKeys;
      method?: M;
      wallet: Wallet;
    },
    ...args: Parameters<C["methods"][M]>
  ) => DeployMethod<C>;
  at: (address: AztecAddress, account: Wallet) => C;
  artifact: ContractArtifact;
}

export function jsonStringifyDeterministic(value: unknown) {
  return stringify(value, { space: "  " }) + "\n";
}

// this function must be sync because it writes to the same file
export function writeDeploymentJsonFiles<
  T extends Record<sutils.AvmChain["id"], unknown>,
>(file: string, content: T) {
  const dynamicChainIds: number[] = [sutils.chains.localNetwork.id];
  const dynamicContent = Object.fromEntries(
    Object.entries(content).filter(([chainId]) =>
      dynamicChainIds.includes(Number(chainId)),
    ),
  );
  // git ignored dynamic files
  fs.writeFileSync(
    `${file}-dynamic.json`,
    jsonStringifyDeterministic(dynamicContent),
  );

  const staticPath = `${file}-static.json`;
  const staticContent = clone(content);
  const existingStaticContent = fs.existsSync(staticPath)
    ? JSON.parse(fs.readFileSync(staticPath, "utf8"))
    : {};
  const keysOfDynamicContent = Object.keys(dynamicContent);
  for (const key of keysOfDynamicContent) {
    // this is to avoid diffs
    staticContent[key as keyof T] = existingStaticContent[key];
  }

  // git tracked static files
  fs.writeFileSync(staticPath, jsonStringifyDeterministic(staticContent));
}

export interface WalletAccount {
  readonly wallet: Wallet;
  readonly address: AztecAddress;
}
