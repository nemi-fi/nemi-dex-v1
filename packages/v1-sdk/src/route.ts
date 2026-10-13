import { Price } from "@uniswap/sdk-core";
import invariant from "tiny-invariant";
import type { L2Token } from "./currency.js";
import type { Pool } from "./pool.js";

export class Route<TInput extends L2Token, TOutput extends L2Token> {
  public readonly pools: Pool[];
  public readonly path: L2Token[];
  public readonly input: TInput;
  public readonly output: TOutput;

  public constructor(pools: Pool[], input: TInput, output: TOutput) {
    invariant(pools.length > 0, "POOLS");
    const chainId: number = pools[0]!.chainId;
    invariant(
      pools.every((pool) => pool.chainId === chainId),
      "CHAIN_IDS",
    );

    const wrappedInput = input.wrapped;
    invariant(pools[0]!.involvesToken(wrappedInput), "INPUT");
    invariant(
      typeof output === "undefined" ||
        pools[pools.length - 1]!.involvesToken(output.wrapped),
      "OUTPUT",
    );

    const path: L2Token[] = [wrappedInput];
    for (const [i, pool] of pools.entries()) {
      const currentInput = path[i]!;
      invariant(
        currentInput.equals(pool.token0) || currentInput.equals(pool.token1),
        "PATH",
      );
      const output = currentInput.equals(pool.token0)
        ? pool.token1
        : pool.token0;
      path.push(output);
    }

    this.pools = pools;
    this.path = path;
    this.input = input;
    this.output = output;
  }

  private _midPrice: Price<TInput, TOutput> | null = null;

  public get midPrice(): Price<TInput, TOutput> {
    if (this._midPrice !== null) return this._midPrice;
    const prices: Price<L2Token, L2Token>[] = [];
    for (const [i, pool] of this.pools.entries()) {
      prices.push(
        this.path[i]!.equals(pool.token0)
          ? new Price(
              pool.reserve0.currency,
              pool.reserve1.currency,
              pool.reserve0.quotient,
              pool.reserve1.quotient,
            )
          : new Price(
              pool.reserve1.currency,
              pool.reserve0.currency,
              pool.reserve1.quotient,
              pool.reserve0.quotient,
            ),
      );
    }
    const reduced = prices
      .slice(1)
      .reduce(
        (accumulator, currentValue) => accumulator.multiply(currentValue),
        prices[0]!,
      );
    return (this._midPrice = new Price(
      this.input,
      this.output,
      reduced.denominator,
      reduced.numerator,
    ));
  }

  public get chainId(): number {
    return this.pools[0]!.chainId;
  }
}
