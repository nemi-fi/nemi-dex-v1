import type { AztecAddress } from "@aztec/aztec.js/addresses";
import type { AppCapabilities } from "@aztec/aztec.js/wallet";
import { sutils } from "@nemi-fi/utils";
import type { CoreService, CurrencyListService } from "../sdk.js";

export class CapabilitiesService {
  constructor(
    private core: CoreService,
    private currencyList: CurrencyListService,
  ) {}

  async getAppCapabilities(): Promise<AppCapabilities> {
    const contracts = await this.#getAppContracts();
    const anyFunction = contracts.map((contract) => ({
      contract,
      function: "*",
    }));

    return {
      version: "1.0",
      metadata: {
        name: "Nemi",
        version: "1.0.0",
        description: "Private swaps and liquidity on Aztec",
        url: typeof window === "undefined" ? undefined : window.origin,
      },
      capabilities: [
        { type: "accounts", canGet: true, canCreateAuthWit: true },
        {
          type: "contracts",
          contracts,
          canRegister: true,
          canGetMetadata: true,
        },
        {
          type: "simulation",
          utilities: { scope: anyFunction },
          transactions: { scope: anyFunction },
        },
        { type: "transaction", scope: anyFunction },
      ],
    };
  }

  async #getAppContracts(): Promise<AztecAddress[]> {
    await this.currencyList.loadCurrenciesOnce();
    const addresses = await Promise.all(
      this.currencyList.currencies.map((token) =>
        sutils.resolveAztecAddress(token.address),
      ),
    );

    const deployments: Record<string, { address: string } | undefined> =
      await this.core.getDeployments();
    const poolManager = deployments.PoolManager;
    if (poolManager) {
      addresses.push(await sutils.resolveAztecAddress(poolManager.address));
    }
    return addresses;
  }
}
