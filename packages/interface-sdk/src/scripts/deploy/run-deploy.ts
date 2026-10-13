import "dotenv/config";

import { sutils } from "@nemi-fi/utils";
import { createCoreForDeploying } from "../../sdk.js";
import { deployAllAndSaveForTokenList } from "./deploy-noir.js";

async function main() {
  const chainName = sutils.ChainNameSchema.parse(process.env.CHAIN);
  const chain = sutils.supportedAvmChains[chainName];
  const sdk = createCoreForDeploying({ chain });

  console.log("deploying to", chain.name, "chain ID", chain.id);

  await deployAllAndSaveForTokenList(sdk);
}

main();
