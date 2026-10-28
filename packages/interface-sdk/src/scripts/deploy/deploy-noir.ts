import { AztecAddress } from "@aztec-labs/aztec.js/addresses";
import type { Contract } from "@aztec-labs/aztec.js/contracts";
import {
  AztecDeploy,
  buildModule,
  writeDeploymentJsonFiles,
} from "@nemi-fi/aztec-deploy";
import { readDeploymentJsonFiles } from "@nemi-fi/aztec-deploy/client";
import {
  PoolManagerContract,
  TokenContract,
} from "@nemi-fi/contracts/contracts";
import { sutils } from "@nemi-fi/utils";
import { consola } from "consola";
import { mapValues, orderBy, pick } from "lodash-es";
import fs from "node:fs";
import path from "node:path";
import { assert } from "ts-essentials";
import { createCoreForDeploying, CurrencyListSchema } from "../../sdk.js";

export async function deployAllAndSaveForTokenList(
  sdk: ReturnType<typeof createCoreForDeploying>,
) {
  const chain = sdk.core.chain;
  const deployer = await sdk.deployments.getSponsoredDeployer();
  await sdk.deployments.deploySponsoredFpc();
  const minter = (await sdk.core.getReadonlyAccount()).address;

  const aztecDeploy = new AztecDeploy(import.meta.dirname, chain, deployer);

  const allModules = { poolManagerModule, tokensModule: tokensModule(minter) };

  for (const [moduleName, module] of Object.entries(allModules)) {
    console.log(`${moduleName} visualization:`);
    const logs = (await aztecDeploy.visualize(module)).map((x) => `  ${x}`);
    for (const log of logs) {
      console.log(log);
    }
  }

  if (chain.id !== sutils.chains.localNetwork.id) {
    const proceed: boolean = await consola.prompt("Proceed with deployment?", {
      type: "confirm",
    });
    if (!proceed) {
      console.log("Deployment cancelled");
      return;
    }
  }

  const deployedModules = await sutils.promiseAllObject(
    mapValues(allModules, (m) => aztecDeploy.deploy(m)),
  );

  await saveToCurrencyList(chain, deployedModules.tokensModule);
}

export const tokensParameters = {
  ETH: { name: "Ethereum", decimals: 9 }, // TODO(security): change to 18
  DAI: { name: "Dai Stablecoin", decimals: 9 }, // TODO(security): change to 18
  BTC: { name: "Bitcoin", decimals: 8 },
  AAVE: { name: "Aave", decimals: 9 }, // TODO(security): change to 18
  UNI: { name: "Uniswap", decimals: 9 }, // TODO(security): change to 18
  SOL: { name: "Solana", decimals: 9 },
};

export const tokensModule = (minter: AztecAddress) =>
  buildModule((m) => {
    const tokensParametersToUse =
      process.env.NODE_ENV === "test"
        ? pick(tokensParameters, ["ETH", "DAI"])
        : tokensParameters;
    const tokens = Object.fromEntries(
      Object.entries(tokensParametersToUse).map(([symbol, token]) => {
        const deployed = m.contract(
          TokenContract,
          "constructor_with_minter",
          // trailing zero address is the auth contract, which disables the
          // per-transfer authorization hook added in aztec-standards v5
          [token.name, symbol, token.decimals, minter, AztecAddress.zero()],
          { id: symbol },
        );
        return [symbol, deployed];
      }),
    );
    return tokens;
  });

export const poolManagerModule = buildModule((m) => {
  const poolManager = m.contract(PoolManagerContract, "constructor", [
    m.deployer.address,
  ]);
  return { poolManager };
});

async function saveToCurrencyList(
  chain: sutils.AvmChain,
  tokens: Record<string, Contract>,
) {
  for (const [symbol, token] of Object.entries(tokens)) {
    const params = tokensParameters[symbol as keyof typeof tokensParameters];
    assert(params, `Token params for ${symbol} not found`);
    await saveToCurrencyListSingle(chain, token.address, {
      symbol,
      name: params.name,
      decimals: params.decimals,
    });
  }
}

async function saveToCurrencyListSingle(
  chain: sutils.AvmChain,
  deployed: AztecAddress,
  token: { symbol: string; name: string; decimals: number },
) {
  const basePath = path.join(import.meta.dirname, "currency-list");
  const dynamicPath = `${basePath}-dynamic.json`;
  const staticPath = `${basePath}-static.json`;
  const currencyList = CurrencyListSchema.parse(
    await readDeploymentJsonFiles(
      fs.existsSync(dynamicPath)
        ? JSON.parse(fs.readFileSync(dynamicPath, "utf-8") ?? "{}")
        : {},
      fs.existsSync(staticPath)
        ? JSON.parse(fs.readFileSync(staticPath, "utf-8") ?? "{}")
        : {},
    ),
  );
  currencyList[chain.id] = orderBy(
    (currencyList[chain.id] ?? [])
      .filter((c) => c.symbol !== token.symbol)
      .concat({
        chainId: chain.id,
        address: deployed.toString(),
        decimals: token.decimals,
        symbol: token.symbol,
        name: token.name,
      }),
    (c) => c.symbol,
  );
  writeDeploymentJsonFiles(basePath, currencyList);
}
