import type { AztecAddress } from "@aztec/aztec.js/addresses";
import { readDeploymentJsonFiles } from "@nemi-fi/aztec-deploy/client";
import { sutils } from "@nemi-fi/utils";
import { L2Token } from "@nemi-fi/v1-sdk";
import type { CurrencyAmount } from "@uniswap/sdk-core";
import { orderBy, uniqWith } from "lodash-es";
import { z } from "zod";
import type { CoreService, LoggerService } from "../sdk.js";
import { currencyListCustom } from "./currency-list-custom.js";

export class CurrencyListService {
  constructor(
    private core: CoreService,
    private logger: LoggerService,
  ) {}

  readonly #currencies = sutils.svelte.state<L2Token[]>([]);

  get currencies() {
    this.loadCurrenciesOnce(); // TODO: remove this ugly hack
    return this.#currencies.current;
  }

  /**
   * @deprecated rethink how to load currencies
   */
  async loadCurrencies() {
    // TODO(perf): load currencies per chain on demand
    const currenciesJson = await readDeploymentJsonFiles(
      (await import("../scripts/deploy/currency-list-dynamic.json")).default,
      (await import("../scripts/deploy/currency-list-static.json")).default,
    );
    const chainId = this.core.chain.id;
    const allCurrenciesList = [
      ...currenciesJson[chainId],
      ...currencyListCustom[chainId],
    ];
    const currencies = allCurrenciesList.map(
      (c) => new L2Token(chainId, c.address, c.decimals, c.symbol, c.name),
    );
    this.#addCurrencies(currencies);
    this.logger.info("Loaded currencies from currency list", currencies.length);
  }

  /**
   * @deprecated rethink how to load currencies
   */
  loadCurrenciesOnce = sutils.lazyValue(() => this.loadCurrencies());

  getCurrency(
    token: string | AztecAddress,
    { currencies = this.currencies } = {},
  ) {
    const tokenAddress = typeof token === "string" ? token : token.toString();
    return currencies.find((t) =>
      sutils.isAddressEqual(t.address, tokenAddress),
    );
  }

  async getCurrencyByAddressOrThrow(address: string | AztecAddress) {
    await this.loadCurrenciesOnce();
    const currency = this.getCurrency(address);
    if (!currency) {
      throw new Error(`Currency not found: ${address}`);
    }
    return currency;
  }

  /**
   * @deprecated use only for testing
   */
  getCurrencyBySymbol(symbol: string) {
    return this.currencies.find((c) => c.symbol === symbol);
  }

  shouldHideBalance(balance: CurrencyAmount<L2Token>): boolean {
    const alwaysShowSymbols = ["ETH", "BTC", "USDC", "DAI"];
    if (
      balance.currency.symbol &&
      alwaysShowSymbols.includes(balance.currency.symbol)
    ) {
      return false;
    }
    return balance.equalTo(0);
  }

  #addCurrencies(currencies: L2Token[]) {
    const currenciesOrder = ["ETH", "USDC", "DAI", "BTC", "SOL"].reverse();
    const currenciesToAdd = currencies.filter((c) => c.symbol != null);
    this.#currencies.current = orderBy(
      uniqWith([...this.#currencies.current, ...currenciesToAdd], (a, b) =>
        a.equals(b),
      ),
      (c) => currenciesOrder.indexOf(c.symbol!),
      "desc",
    );
  }
}

export type TokenSerializedSchema = z.infer<typeof TokenSerializedSchema>;
export const TokenSerializedSchema = z.object({
  chainId: z.number(),
  address: z.string(),
  decimals: z.number(),
  symbol: z.string().optional(),
  name: z.string().optional(),
});

export type CurrencyListSchema = z.infer<typeof CurrencyListSchema>;
export const CurrencyListSchema = z.record(
  z.coerce.number().describe("chainId"),
  z.array(TokenSerializedSchema),
);
