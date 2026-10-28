import type { ContractArtifact } from "@aztec-labs/aztec.js/abi";
import {
  computeContractAddressFromInstance,
  ContractInstanceWithAddressSchema,
  getContractClassFromArtifact,
} from "@aztec-labs/stdlib/contract";
import {
  PoolManagerContract,
  TokenContract,
} from "@nemi-fi/contracts/contracts";
import { sutils } from "@nemi-fi/utils";
import { describe, expect, test } from "vitest";
import { z } from "zod";
import { CurrencyListSchema } from "../../sdk.js";
import currencyListStatic from "./currency-list-static.json" with { type: "json" };
import { tokensParameters } from "./deploy-noir.js";
import deploymentsStatic from "./deployments-static.json" with { type: "json" };

// Every contract the production code loads from `deployments-static.json`, keyed by
// deployment name. Must stay in sync with the modules in `deploy-noir.ts`.
const expectedArtifacts: Record<string, ContractArtifact> = {
  PoolManager: PoolManagerContract.artifact,
  ...Object.fromEntries(
    Object.keys(tokensParameters).map((symbol) => [
      symbol,
      TokenContract.artifact,
    ]),
  ),
};

// local network is redeployed from scratch on every `aztec:deploy`, so its entries are not tracked
const deployedChains = Object.entries(sutils.supportedAvmChains)
  .filter(([, chain]) => chain.id !== sutils.chains.localNetwork.id)
  .map(([chainName, chain]) => ({ chainName, chain }));

const deployments = z
  .record(
    z.coerce.number().describe("chain.id"),
    z.record(
      z.string().describe("contract name"),
      ContractInstanceWithAddressSchema,
    ),
  )
  .parse(deploymentsStatic);
const currencyList = CurrencyListSchema.parse(currencyListStatic);

describe.each(deployedChains)(
  "deployments on $chainName",
  ({ chainName, chain }) => {
    const chainDeployments = deployments[chain.id] ?? {};

    test("all contracts are deployed", () => {
      expect(Object.keys(chainDeployments).sort()).toEqual(
        Object.keys(expectedArtifacts).sort(),
      );
    });

    test.each(Object.entries(expectedArtifacts))(
      "%s matches the current artifact",
      async (name, artifact) => {
        const deployment = chainDeployments[name];
        expect(deployment, `${name} is not deployed`).toBeDefined();

        const contractClass = await getContractClassFromArtifact(artifact);
        expect(
          deployment!.currentContractClassId.toString(),
          `${name} artifact changed but ${name} was not redeployed on ${chain.name}. Run \`CHAIN=${chainName} pnpm aztec:deploy\``,
        ).toBe(contractClass.id.toString());

        // guards against hand-edited class ids that don't belong to the deployed address
        expect(
          (await computeContractAddressFromInstance(deployment!)).toString(),
        ).toBe(deployment!.address.toString());
      },
    );

    test("currency list points to deployed tokens", () => {
      const tokens = currencyList[chain.id] ?? [];
      expect(
        Object.fromEntries(tokens.map((t) => [t.symbol, t.address])),
      ).toEqual(
        Object.fromEntries(
          Object.keys(tokensParameters).map((symbol) => [
            symbol,
            chainDeployments[symbol]?.address.toString(),
          ]),
        ),
      );
    });
  },
);
