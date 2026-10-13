import type { AztecAddress } from "@aztec/aztec.js/addresses";
import { sutils } from "@nemi-fi/utils";
import { type L2Token } from "@nemi-fi/v1-sdk";
import { CurrencyAmount, Price, type Currency } from "@uniswap/sdk-core";
import { compact, first } from "lodash-es";
import type {
  Account,
  CoreService,
  LoggerService,
  TransactionTrackerService,
} from "../../sdk.js";
import { encodeSwapApiQuote } from "../server/SwapApiService.js";
import {
  executeSwapApiQuote,
  type ExecuteInfo,
} from "../swap-api-helpers-for-public.js";

export class UniversalRouter implements IQuoter {
  constructor(
    private core: CoreService,
    private transactionTracker: TransactionTrackerService,
    private logger: LoggerService,
    private routers: IQuoter[],
  ) {}

  async executeQuote(account: Account, quote: IQuote) {
    const txHash = await executeSwapApiQuote(
      account.wallet,
      account.address,
      await encodeSwapApiQuote(quote),
      // Sponsorship applies only to the embedded wallet; an external wallet gets no payment
      // method and pays its own fees.
      {
        fee: {
          paymentMethod: await this.core.getSponsoredFeePaymentMethodFor(
            account.wallet,
          ),
        },
      },
    );

    this.logger.info("execute quote tx:", txHash.toString());

    const description = `swap ${sutils.displayCurrencyAmount(
      quote.amountIn,
    )} -> ~${sutils.displayCurrencyAmount(quote.amountOut)}`;

    return await this.transactionTracker.trackWithAccount(
      account,
      txHash,
      description,
    );
  }

  /**
   * The best quote for the full amount.
   *
   * There is deliberately no split routing. Quoting two legs of one trade independently prices
   * each against the same, untouched reserves, so when both legs go through a shared pool the
   * second one executes against reserves the first already moved, gets less than quoted, and
   * reverts with INSUFFICIENT_OUTPUT_AMOUNT.
   */
  async getQuote(params: GetQuoteParams): Promise<IQuote | undefined> {
    return first(await this.#getQuote(params));
  }

  async #getQuote(params: GetQuoteParams): Promise<IQuote[]> {
    const quotes = compact(
      await Promise.all(
        this.routers.map(async (r) => {
          try {
            return await r.getQuote(params);
          } catch (e) {
            // TODO: trace errors from quoters
            // this.logger.error(e);
            return undefined;
          }
        }),
      ),
    );
    // TODO(correctness): order by amountOut (should be equivalent to ordering by executionPrice because: amountOut = amountIn * executionPrice, amountIn is constant)
    return orderByPrice(quotes, (q) => q.executionPrice);
  }
}

export type GetQuoteParams = {
  account?: AztecAddress;
  amountIn: CurrencyAmount<L2Token>;
  currencyOut: L2Token;
};

export interface IQuoter {
  getQuote(params: GetQuoteParams): Promise<IQuote | undefined>;
}

export class IQuote {
  constructor(
    // TODO(security): this leaks info about the account being used to request the quote because authwits contain the address of the account
    readonly executeInfo: ExecuteInfo,
    readonly amountIn: CurrencyAmount<L2Token>,
    readonly amountOut: CurrencyAmount<L2Token>,
  ) {}

  get executionPrice(): Price<L2Token, L2Token> {
    return new Price({
      baseAmount: this.amountIn,
      quoteAmount: this.amountOut,
    });
  }
}

export function orderByPrice<T>(
  arr: T[],
  f: (value: T) => Price<Currency, Currency>,
): T[] {
  return arr.slice().sort((a, b) => {
    const aPrice = f(a);
    const bPrice = f(b);
    if (aPrice.greaterThan(bPrice)) {
      return -1;
    }
    if (aPrice.lessThan(bPrice)) {
      return 1;
    }
    return 0;
  });
}
