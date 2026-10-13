import type { Pool } from "@nemi-fi/v1-sdk";
import ms from "ms";
import type { AmmService } from "../AmmService.js";
import type { GetQuoteParams, IQuote, IQuoter } from "./UniversalRouter.js";

export class AmmRouter implements IQuoter {
  constructor(private amm: AmmService) {}

  // TODO(perf): find a way to pass pools as an argument
  async getQuote(params: GetQuoteParams) {
    const pools = await this.#getPoolsCached();
    const trade = this.amm.getBestTradeExactIn({
      ...params,
      pools,
    });
    if (!trade) {
      return undefined;
    }
    const quote: IQuote = {
      executeInfo: await this.amm.getSwapParams({
        account: params.account,
        trade,
      }),
      amountIn: trade.inputAmount,
      amountOut: trade.outputAmount,
      executionPrice: trade.executionPrice,
    };
    return quote;
  }

  #poolsCache: { timestamp: number; data: Promise<Pool[]> } | undefined;
  /**
   * @deprecated this is a temporary workaround to reduce network requests.
   */
  #getPoolsCached() {
    const cached = this.#poolsCache;
    if (cached && Date.now() - cached.timestamp < ms("1 second")) {
      return cached.data;
    }
    const pools = this.amm.loadPools();
    this.#poolsCache = {
      timestamp: Date.now(),
      data: pools,
    };
    return pools;
  }
}
