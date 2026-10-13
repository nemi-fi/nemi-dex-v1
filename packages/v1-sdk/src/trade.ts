import {
  CurrencyAmount,
  Fraction,
  Percent,
  Price,
  TradeType,
  sortedInsert,
} from "@uniswap/sdk-core";
import invariant from "tiny-invariant";
import { ONE, ZERO } from "./constants.js";
import type { L2Token } from "./currency.js";
import type { Pool } from "./pool.js";
import { Route } from "./route.js";

export class Trade<
  TInput extends L2Token,
  TOutput extends L2Token,
  TTradeType extends TradeType,
> {
  /**
   * The route of the trade, i.e. which pools the trade goes through and the input/output currencies.
   */
  public readonly route: Route<TInput, TOutput>;
  /**
   * The type of the trade, either exact in or exact out.
   */
  public readonly tradeType: TTradeType;
  /**
   * The input amount for the trade assuming no slippage.
   */
  public readonly inputAmount: CurrencyAmount<TInput>;
  /**
   * The output amount for the trade assuming no slippage.
   */
  public readonly outputAmount: CurrencyAmount<TOutput>;
  /**
   * The price expressed in terms of output amount/input amount.
   */
  public readonly executionPrice: Price<TInput, TOutput>;
  /**
   * The percent difference between the mid price before the trade and the trade execution price.
   */
  public readonly priceImpact: Percent;

  /**
   * Constructs an exact in trade with the given amount in and route
   * @param route route of the exact in trade
   * @param amountIn the amount being passed in
   */
  public static exactIn<TInput extends L2Token, TOutput extends L2Token>(
    route: Route<TInput, TOutput>,
    amountIn: CurrencyAmount<TInput>,
  ): Trade<TInput, TOutput, TradeType.EXACT_INPUT> {
    return new Trade(route, amountIn, TradeType.EXACT_INPUT);
  }

  /**
   * Constructs an exact out trade with the given amount out and route
   * @param route route of the exact out trade
   * @param amountOut the amount returned by the trade
   */
  public static exactOut<TInput extends L2Token, TOutput extends L2Token>(
    route: Route<TInput, TOutput>,
    amountOut: CurrencyAmount<TOutput>,
  ): Trade<TInput, TOutput, TradeType.EXACT_OUTPUT> {
    return new Trade(route, amountOut, TradeType.EXACT_OUTPUT);
  }

  public constructor(
    route: Route<TInput, TOutput>,
    amount: TTradeType extends TradeType.EXACT_INPUT
      ? CurrencyAmount<TInput>
      : CurrencyAmount<TOutput>,
    tradeType: TTradeType,
  ) {
    this.route = route;
    this.tradeType = tradeType;

    const tokenAmounts: CurrencyAmount<L2Token>[] = new Array(
      route.path.length,
    );
    if (tradeType === TradeType.EXACT_INPUT) {
      invariant(amount.currency.equals(route.input), "INPUT");
      tokenAmounts[0] = amount.wrapped;
      for (let i = 0; i < route.path.length - 1; i++) {
        const pool = route.pools[i]!;
        const [outputAmount] = pool.getOutputAmount(tokenAmounts[i]!);
        tokenAmounts[i + 1] = outputAmount;
      }
      this.inputAmount = CurrencyAmount.fromFractionalAmount(
        route.input,
        amount.numerator,
        amount.denominator,
      );
      this.outputAmount = CurrencyAmount.fromFractionalAmount(
        route.output,
        tokenAmounts[tokenAmounts.length - 1]!.numerator,
        tokenAmounts[tokenAmounts.length - 1]!.denominator,
      );
    } else {
      invariant(amount.currency.equals(route.output), "OUTPUT");
      tokenAmounts[tokenAmounts.length - 1] = amount.wrapped;
      for (let i = route.path.length - 1; i > 0; i--) {
        const pool = route.pools[i - 1]!;
        const [inputAmount] = pool.getInputAmount(tokenAmounts[i]!);
        tokenAmounts[i - 1] = inputAmount;
      }
      this.inputAmount = CurrencyAmount.fromFractionalAmount(
        route.input,
        tokenAmounts[0]!.numerator,
        tokenAmounts[0]!.denominator,
      );
      this.outputAmount = CurrencyAmount.fromFractionalAmount(
        route.output,
        amount.numerator,
        amount.denominator,
      );
    }
    this.executionPrice = new Price(
      this.inputAmount.currency,
      this.outputAmount.currency,
      this.inputAmount.quotient,
      this.outputAmount.quotient,
    );
    this.priceImpact = computePriceImpact(
      route.midPrice,
      this.inputAmount,
      this.outputAmount,
    );
  }

  /**
   * Get the minimum amount that must be received from this trade for the given slippage tolerance
   * @param slippageTolerance tolerance of unfavorable slippage from the execution price of this trade
   */
  public minimumAmountOut(slippageTolerance: Percent): CurrencyAmount<TOutput> {
    invariant(!slippageTolerance.lessThan(ZERO), "SLIPPAGE_TOLERANCE");
    if (this.tradeType === TradeType.EXACT_OUTPUT) {
      return this.outputAmount;
    } else {
      const slippageAdjustedAmountOut = new Fraction(ONE)
        .add(slippageTolerance)
        .invert()
        .multiply(this.outputAmount.quotient).quotient;
      return CurrencyAmount.fromRawAmount(
        this.outputAmount.currency,
        slippageAdjustedAmountOut,
      );
    }
  }

  /**
   * Get the maximum amount in that can be spent via this trade for the given slippage tolerance
   * @param slippageTolerance tolerance of unfavorable slippage from the execution price of this trade
   */
  public maximumAmountIn(slippageTolerance: Percent): CurrencyAmount<TInput> {
    invariant(!slippageTolerance.lessThan(ZERO), "SLIPPAGE_TOLERANCE");
    if (this.tradeType === TradeType.EXACT_INPUT) {
      return this.inputAmount;
    } else {
      const slippageAdjustedAmountIn = new Fraction(ONE)
        .add(slippageTolerance)
        .multiply(this.inputAmount.quotient).quotient;
      return CurrencyAmount.fromRawAmount(
        this.inputAmount.currency,
        slippageAdjustedAmountIn,
      );
    }
  }

  /**
   * Given a list of pools, and a fixed amount in, returns the top `maxNumResults` trades that go from an input token
   * amount to an output token, making at most `maxHops` hops.
   * Note this does not consider aggregation, as routes are linear. It's possible a better route exists by splitting
   * the amount in among multiple routes.
   * @param pools the pools to consider in finding the best trade
   * @param nextAmountIn exact amount of input currency to spend
   * @param currencyOut the desired currency out
   * @param maxNumResults maximum number of results to return
   * @param maxHops maximum number of hops a returned trade can make, e.g. 1 hop goes through a single pool
   * @param currentPools used in recursion; the current list of pools
   * @param currencyAmountIn used in recursion; the original value of the currencyAmountIn parameter
   * @param bestTrades used in recursion; the current list of best trades
   */
  public static bestTradeExactIn<
    TInput extends L2Token,
    TOutput extends L2Token,
  >(
    pools: Pool[],
    currencyAmountIn: CurrencyAmount<TInput>,
    currencyOut: TOutput,
    { maxNumResults = 3, maxHops = 3 }: BestTradeOptions = {},
    // used in recursion.
    currentPools: Pool[] = [],
    nextAmountIn: CurrencyAmount<L2Token> = currencyAmountIn,
    bestTrades: Trade<TInput, TOutput, TradeType.EXACT_INPUT>[] = [],
  ): Trade<TInput, TOutput, TradeType.EXACT_INPUT>[] {
    invariant(pools.length > 0, "POOLS");
    invariant(maxHops > 0, "MAX_HOPS");
    invariant(
      currencyAmountIn === nextAmountIn || currentPools.length > 0,
      "INVALID_RECURSION",
    );

    const amountIn = nextAmountIn.wrapped;
    const tokenOut = currencyOut.wrapped;
    for (let i = 0; i < pools.length; i++) {
      const pool = pools[i]!;
      // pool irrelevant
      if (
        !pool.token0.equals(amountIn.currency) &&
        !pool.token1.equals(amountIn.currency)
      )
        continue;
      if (pool.reserve0.equalTo(0) || pool.reserve1.equalTo(0)) continue;

      let amountOut: CurrencyAmount<L2Token>;
      try {
        [amountOut] = pool.getOutputAmount(amountIn);
      } catch (error: any) {
        // input too low
        if (error?.isInsufficientInputAmountError) {
          continue;
        }
        throw error;
      }
      // we have arrived at the output token, so this is the final trade of one of the paths
      if (amountOut.currency.equals(tokenOut)) {
        sortedInsert(
          bestTrades,
          new Trade(
            new Route(
              [...currentPools, pool],
              currencyAmountIn.currency,
              currencyOut,
            ),
            currencyAmountIn,
            TradeType.EXACT_INPUT,
          ),
          maxNumResults,
          tradeComparator,
        );
      } else if (maxHops > 1 && pools.length > 1) {
        const poolsExcludingThisPool = pools
          .slice(0, i)
          .concat(pools.slice(i + 1, pools.length));

        // otherwise, consider all the other paths that lead from this token as long as we have not exceeded maxHops
        Trade.bestTradeExactIn(
          poolsExcludingThisPool,
          currencyAmountIn,
          currencyOut,
          {
            maxNumResults,
            maxHops: maxHops - 1,
          },
          [...currentPools, pool],
          amountOut,
          bestTrades,
        );
      }
    }

    return bestTrades;
  }

  // /**
  //  * Return the execution price after accounting for slippage tolerance
  //  * @param slippageTolerance the allowed tolerated slippage
  //  */
  // public worstExecutionPrice(
  //   slippageTolerance: Percent,
  // ): Price<TInput, TOutput> {
  //   return new Price(
  //     this.inputAmount.currency,
  //     this.outputAmount.currency,
  //     this.maximumAmountIn(slippageTolerance).quotient,
  //     this.minimumAmountOut(slippageTolerance).quotient,
  //   );
  // }

  // /**
  //  * similar to the above method but instead targets a fixed output amount
  //  * given a list of pools, and a fixed amount out, returns the top `maxNumResults` trades that go from an input token
  //  * to an output token amount, making at most `maxHops` hops
  //  * note this does not consider aggregation, as routes are linear. it's possible a better route exists by splitting
  //  * the amount in among multiple routes.
  //  * @param pools the pools to consider in finding the best trade
  //  * @param currencyIn the currency to spend
  //  * @param nextAmountOut the exact amount of currency out
  //  * @param maxNumResults maximum number of results to return
  //  * @param maxHops maximum number of hops a returned trade can make, e.g. 1 hop goes through a single pool
  //  * @param currentPools used in recursion; the current list of pools
  //  * @param currencyAmountOut used in recursion; the original value of the currencyAmountOut parameter
  //  * @param bestTrades used in recursion; the current list of best trades
  //  */
  // public static bestTradeExactOut<
  //   TInput extends Currency,
  //   TOutput extends Currency,
  // >(
  //   pools: Pool[],
  //   currencyIn: TInput,
  //   currencyAmountOut: CurrencyAmount<TOutput>,
  //   { maxNumResults = 3, maxHops = 3 }: BestTradeOptions = {},
  //   // used in recursion.
  //   currentPools: Pool[] = [],
  //   nextAmountOut: CurrencyAmount<Currency> = currencyAmountOut,
  //   bestTrades: Trade<TInput, TOutput, TradeType.EXACT_OUTPUT>[] = [],
  // ): Trade<TInput, TOutput, TradeType.EXACT_OUTPUT>[] {
  //   invariant(pools.length > 0, "POOLS");
  //   invariant(maxHops > 0, "MAX_HOPS");
  //   invariant(
  //     currencyAmountOut === nextAmountOut || currentPools.length > 0,
  //     "INVALID_RECURSION",
  //   );

  //   const amountOut = nextAmountOut.wrapped;
  //   const tokenIn = currencyIn.wrapped;
  //   for (let i = 0; i < pools.length; i++) {
  //     const pool = pools[i];
  //     // pool irrelevant
  //     if (
  //       !pool.token0.equals(amountOut.currency) &&
  //       !pool.token1.equals(amountOut.currency)
  //     )
  //       continue;
  //     if (pool.reserve0.equalTo(0) || pool.reserve1.equalTo(0)) continue;

  //     let amountIn: CurrencyAmount<Token>;
  //     try {
  //       [amountIn] = pool.getInputAmount(amountOut);
  //     } catch (error) {
  //       // not enough liquidity in this pool
  //       if (error.isInsufficientReservesError) {
  //         continue;
  //       }
  //       throw error;
  //     }
  //     // we have arrived at the input token, so this is the first trade of one of the paths
  //     if (amountIn.currency.equals(tokenIn)) {
  //       sortedInsert(
  //         bestTrades,
  //         new Trade(
  //           new Route(
  //             [pool, ...currentPools],
  //             currencyIn,
  //             currencyAmountOut.currency,
  //           ),
  //           currencyAmountOut,
  //           TradeType.EXACT_OUTPUT,
  //         ),
  //         maxNumResults,
  //         tradeComparator,
  //       );
  //     } else if (maxHops > 1 && pools.length > 1) {
  //       const poolsExcludingThisPool = pools
  //         .slice(0, i)
  //         .concat(pools.slice(i + 1, pools.length));

  //       // otherwise, consider all the other paths that arrive at this token as long as we have not exceeded maxHops
  //       Trade.bestTradeExactOut(
  //         poolsExcludingThisPool,
  //         currencyIn,
  //         currencyAmountOut,
  //         {
  //           maxNumResults,
  //           maxHops: maxHops - 1,
  //         },
  //         [pool, ...currentPools],
  //         amountIn,
  //         bestTrades,
  //       );
  //     }
  //   }

  //   return bestTrades;
  // }
}

export interface BestTradeOptions {
  // how many results to return
  maxNumResults?: number;
  // the maximum number of hops a trade should contain
  maxHops?: number;
}

// minimal interface so the input output comparator may be shared across types
interface InputOutput<TInput extends L2Token, TOutput extends L2Token> {
  readonly inputAmount: CurrencyAmount<TInput>;
  readonly outputAmount: CurrencyAmount<TOutput>;
}

// comparator function that allows sorting trades by their output amounts, in decreasing order, and then input amounts
// in increasing order. i.e. the best trades have the most outputs for the least inputs and are sorted first
export function inputOutputComparator<
  TInput extends L2Token,
  TOutput extends L2Token,
>(a: InputOutput<TInput, TOutput>, b: InputOutput<TInput, TOutput>): number {
  // must have same input and output token for comparison
  invariant(
    a.inputAmount.currency.equals(b.inputAmount.currency),
    "INPUT_CURRENCY",
  );
  invariant(
    a.outputAmount.currency.equals(b.outputAmount.currency),
    "OUTPUT_CURRENCY",
  );
  if (a.outputAmount.equalTo(b.outputAmount)) {
    if (a.inputAmount.equalTo(b.inputAmount)) {
      return 0;
    }
    // trade A requires less input than trade B, so A should come first
    if (a.inputAmount.lessThan(b.inputAmount)) {
      return -1;
    } else {
      return 1;
    }
  } else {
    // tradeA has less output than trade B, so should come second
    if (a.outputAmount.lessThan(b.outputAmount)) {
      return 1;
    } else {
      return -1;
    }
  }
}

// extension of the input output comparator that also considers other dimensions of the trade in ranking them
export function tradeComparator<
  TInput extends L2Token,
  TOutput extends L2Token,
  TTradeType extends TradeType,
>(
  a: Trade<TInput, TOutput, TTradeType>,
  b: Trade<TInput, TOutput, TTradeType>,
) {
  const ioComp = inputOutputComparator(a, b);
  if (ioComp !== 0) {
    return ioComp;
  }

  // TODO: uncomment
  // // consider lowest slippage next, since these are less likely to fail
  // if (a.priceImpact.lessThan(b.priceImpact)) {
  //   return -1;
  // } else if (a.priceImpact.greaterThan(b.priceImpact)) {
  //   return 1;
  // }

  // finally consider the number of hops since each hop costs gas
  return a.route.path.length - b.route.path.length;
}

/**
 * Returns the percent difference between the mid price and the execution price, i.e. price impact.
 * @param midPrice mid price before the trade
 * @param inputAmount the input amount of the trade
 * @param outputAmount the output amount of the trade
 */
export function computePriceImpact<
  TBase extends L2Token,
  TQuote extends L2Token,
>(
  midPrice: Price<TBase, TQuote>,
  inputAmount: CurrencyAmount<TBase>,
  outputAmount: CurrencyAmount<TQuote>,
): Percent {
  const quotedOutputAmount = midPrice.quote(inputAmount);
  // calculate price impact := (exactQuote - outputAmount) / exactQuote
  const priceImpact = quotedOutputAmount
    .subtract(outputAmount)
    .divide(quotedOutputAmount);
  return new Percent(priceImpact.numerator, priceImpact.denominator);
}
