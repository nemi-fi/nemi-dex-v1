import { sutils } from "@nemi-fi/utils";
import type { Hex } from "ox";
import { assert } from "ts-essentials";
import { z } from "zod";

export type DeployConfig = {
  poolManagerAdmin: Hex.Hex | "deployer";
  deployerPrivateKey: Hex.Hex;
  /** Fee juice bridged to the deployer. It can't be bridged back to L1. */
  feeJuiceBridgeAmount: bigint;
};

const deployConfigs: Record<
  sutils.SupportedAvmChains["id"],
  () => DeployConfig
> = {
  [sutils.chains.mainnet.id]: () => ({
    poolManagerAdmin:
      "0x197260cf1599e14eed1cbd4809ea791022c9e5755632307cd8ff517f69da1b07",
    deployerPrivateKey: envPrivateKey("MAINNET_PRIVATE_KEY"),
    // a PoolManager deploy measured ~2.8 FJ, but the node requires the max fee (~21 FJ) up front
    feeJuiceBridgeAmount: 30n * 10n ** 18n,
  }),
  [sutils.chains.testnet.id]: () => ({
    poolManagerAdmin: "deployer",
    deployerPrivateKey: envPrivateKey("SEPOLIA_PRIVATE_KEY"),
    feeJuiceBridgeAmount: 1000n * 10n ** 18n,
  }),
  [sutils.chains.localNetwork.id]: () => ({
    poolManagerAdmin: "deployer",
    deployerPrivateKey:
      "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6", // anvil
    feeJuiceBridgeAmount: 1000n * 10n ** 18n,
  }),
};

export function getDeployConfig(
  chainId: sutils.SupportedAvmChains["id"],
): DeployConfig {
  return deployConfigs[chainId]();
}

function envPrivateKey(name: string): Hex.Hex {
  const key = process.env[name];
  assert(key, `${name} is not set`);
  return z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/, `${name} is not a valid private key`)
    .parse(key) as Hex.Hex;
}
