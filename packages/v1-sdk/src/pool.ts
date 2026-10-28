import type { Fr } from "@aztec-labs/foundation/curves/bn254";
import {
  CurrencyAmount,
  Fraction,
  Percent,
  Price,
  sqrt,
  type BigintIsh,
} from "@uniswap/sdk-core";
import invariant from "tiny-invariant";
import {
  FEE_DENOMINATOR,
  FEE_NUMERATOR,
  FIVE,
  MINIMUM_LIQUIDITY,
  ONE,
  ZERO,
} from "./constants.js";
import { L2Token, tokenAddressSortsBefore } from "./currency.js";
import {
  InsufficientInputAmountError,
  InsufficientReservesError,
} from "./errors.js";
import { JSBI } from "./jsbi.js";

export class Pool {
  readonly poolId: string;

  readonly feeTier: Percent = new Percent(1).subtract(
    new Percent(FEE_NUMERATOR, FEE_DENOMINATOR),
  );

  private readonly tokenAmounts: [
    CurrencyAmount<L2Token>,
    CurrencyAmount<L2Token>,
  ];

  private constructor(
    poolId: string,
    currencyAmountA: CurrencyAmount<L2Token>,
    currencyAmountB: CurrencyAmount<L2Token>,
  ) {
    this.poolId = poolId;
    const tokenAmounts = currencyAmountA.currency.sortsBefore(
      currencyAmountB.currency,
    ) // does safety checks
      ? [currencyAmountA, currencyAmountB]
      : [currencyAmountB, currencyAmountA];
    this.tokenAmounts = tokenAmounts as [
      CurrencyAmount<L2Token>,
      CurrencyAmount<L2Token>,
    ];
  }

  static async new(
    currencyAmountA: CurrencyAmount<L2Token>,
    currencyAmountB: CurrencyAmount<L2Token>,
  ) {
    const poolId = await getPoolId(
      currencyAmountA.currency,
      currencyAmountB.currency,
    );
    return new Pool(poolId, currencyAmountA, currencyAmountB);
  }

  /**
   * Returns true if the token is either token0 or token1
   * @param token to check
   */
  public involvesToken(token: L2Token): boolean {
    return token.equals(this.token0) || token.equals(this.token1);
  }

  /**
   * Returns the current mid price of the pool in terms of token0, i.e. the ratio of reserve1 to reserve0
   */
  public get token0Price(): Price<L2Token, L2Token> {
    const result = this.tokenAmounts[1].divide(this.tokenAmounts[0]);
    return new Price(
      this.token0,
      this.token1,
      result.denominator,
      result.numerator,
    );
  }

  /**
   * Returns the current mid price of the pool in terms of token1, i.e. the ratio of reserve0 to reserve1
   */
  public get token1Price(): Price<L2Token, L2Token> {
    const result = this.tokenAmounts[0].divide(this.tokenAmounts[1]);
    return new Price(
      this.token1,
      this.token0,
      result.denominator,
      result.numerator,
    );
  }

  /**
   * Return the price of the given token in terms of the other token in the pool.
   * @param token token to return price of
   */
  public priceOf(token: L2Token): Price<L2Token, L2Token> {
    invariant(this.involvesToken(token), "TOKEN");
    return token.equals(this.token0) ? this.token0Price : this.token1Price;
  }

  /**
   * Returns the chain ID of the tokens in the pool.
   */
  public get chainId(): number {
    return this.token0.chainId;
  }

  public get token0(): L2Token {
    return this.tokenAmounts[0].currency;
  }

  public get token1(): L2Token {
    return this.tokenAmounts[1].currency;
  }

  public get reserve0(): CurrencyAmount<L2Token> {
    return this.tokenAmounts[0];
  }

  public get reserve1(): CurrencyAmount<L2Token> {
    return this.tokenAmounts[1];
  }

  public reserveOf(token: L2Token): CurrencyAmount<L2Token> {
    invariant(this.involvesToken(token), "TOKEN");
    return token.equals(this.token0) ? this.reserve0 : this.reserve1;
  }

  /**
   * getAmountOut is the linear algebra of reserve ratio against amountIn:amountOut.
   * https://ethereum.stackexchange.com/questions/101629/what-is-math-for-uniswap-calculates-the-amountout-and-amountin-why-997-and-1000
   * has the math deduction for the reserve calculation without fee-on-transfer fees.
   *
   * With fee-on-transfer tax, intuitively it's just:
   * inputAmountWithFeeAndTax = 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn
   *                          = (1 - amountIn.sellFeesBips / 10000) * amountInWithFee
   * where amountInWithFee is the amountIn after taking out the LP fees
   * outputAmountWithTax = amountOut * (1 - amountOut.buyFeesBips / 10000)
   *
   * But we are illustrating the math deduction below to ensure that's the case.
   *
   * before swap A * B = K where A = reserveIn B = reserveOut
   *
   * after swap A' * B' = K where only k is a constant value
   *
   * getAmountOut
   *
   * A' = A + 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn # here 0.3% is deducted
   * B' = B - amountOut * (1 - amountOut.buyFeesBips / 10000)
   * amountOut = (B - B') / (1 - amountOut.buyFeesBips / 10000) # where A' * B' still is k
   *           = (B - K/(A + 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn))
   *             /
   *             (1 - amountOut.buyFeesBips / 10000)
   *           = (B - AB/(A + 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn))
   *             /
   *             (1 - amountOut.buyFeesBips / 10000)
   *           = ((BA + B * 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn - AB)/(A + 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn))
   *             /
   *             (1 - amountOut.buyFeesBips / 10000)
   *           = (B * 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn / (A + 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn)
   *             /
   *             (1 - amountOut.buyFeesBips / 10000)
   * amountOut * (1 - amountOut.buyFeesBips / 10000) = (B * 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn
   *                                                    /
   *                                                    (A + 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn)
   *
   * outputAmountWithTax = (B * 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn
   *                       /
   *                       (A + 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn)
   *                       = (B * 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn * 1000
   *                       /
   *                       ((A + 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn) * 1000)
   *                     = (B * (1 - amountIn.sellFeesBips / 10000) 997 * * amountIn
   *                       /
   *                       (1000 * A + (1 - amountIn.sellFeesBips / 10000) * 997 * amountIn)
   *                     = (B * (1 - amountIn.sellFeesBips / 10000) * inputAmountWithFee)
   *                       /
   *                       (1000 * A + (1 - amountIn.sellFeesBips / 10000) * inputAmountWithFee)
   *                     = (B * inputAmountWithFeeAndTax)
   *                       /
   *                       (1000 * A + inputAmountWithFeeAndTax)
   *
   * inputAmountWithFeeAndTax = (1 - amountIn.sellFeesBips / 10000) * inputAmountWithFee
   * outputAmountWithTax = amountOut * (1 - amountOut.buyFeesBips / 10000)
   *
   * @param inputAmount
   * @param calculateFotFees
   */
  public getOutputAmount(
    inputAmount: CurrencyAmount<L2Token>,
  ): [CurrencyAmount<L2Token>, Pool] {
    invariant(this.involvesToken(inputAmount.currency), "TOKEN");
    if (
      JSBI.equal(this.reserve0.quotient, ZERO) ||
      JSBI.equal(this.reserve1.quotient, ZERO)
    ) {
      throw new InsufficientReservesError();
    }
    const inputReserve = this.reserveOf(inputAmount.currency);
    const outputReserve = this.reserveOf(
      inputAmount.currency.equals(this.token0) ? this.token1 : this.token0,
    );

    const inputAmountAfterTax = inputAmount;

    const inputAmountWithFeeAndAfterTax = JSBI.multiply(
      inputAmountAfterTax.quotient,
      FEE_NUMERATOR,
    );
    const numerator = JSBI.multiply(
      inputAmountWithFeeAndAfterTax,
      outputReserve.quotient,
    );
    const denominator = JSBI.add(
      JSBI.multiply(inputReserve.quotient, FEE_DENOMINATOR),
      inputAmountWithFeeAndAfterTax,
    );
    const outputAmount = CurrencyAmount.fromRawAmount(
      inputAmount.currency.equals(this.token0) ? this.token1 : this.token0,
      JSBI.divide(numerator, denominator), // JSBI.divide will round down by itself, which is desired
    );

    if (JSBI.equal(outputAmount.quotient, ZERO)) {
      throw new InsufficientInputAmountError();
    }

    const outputAmountAfterTax = outputAmount;
    if (JSBI.equal(outputAmountAfterTax.quotient, ZERO)) {
      throw new InsufficientInputAmountError();
    }

    return [
      outputAmountAfterTax,
      new Pool(
        this.poolId,
        inputReserve.add(inputAmountAfterTax),
        outputReserve.subtract(outputAmountAfterTax),
      ),
    ];
  }

  /**
   * getAmountIn is the linear algebra of reserve ratio against amountIn:amountOut.
   * https://ethereum.stackexchange.com/questions/101629/what-is-math-for-uniswap-calculates-the-amountout-and-amountin-why-997-and-1000
   * has the math deduction for the reserve calculation without fee-on-transfer fees.
   *
   * With fee-on-transfer fees, intuitively it's just:
   * outputAmountWithTax = amountOut / (1 - amountOut.buyFeesBips / 10000)
   * inputAmountWithTax = amountIn / (1 - amountIn.sellFeesBips / 10000) / 0.997
   *
   * But we are illustrating the math deduction below to ensure that's the case.
   *
   * before swap A * B = K where A = reserveIn B = reserveOut
   *
   * after swap A' * B' = K where only k is a constant value
   *
   * getAmountIn
   *
   * B' = B - amountOut * (1 - amountOut.buyFeesBips / 10000)
   * A' = A + 0.997 * (1 - amountIn.sellFeesBips / 10000) * amountIn # here 0.3% is deducted
   * amountIn = (A' - A) / (0.997 * (1 - amountIn.sellFeesBips / 10000))
   *          = (K / (B - amountOut / (1 - amountOut.buyFeesBips / 10000)) - A)
   *            /
   *            (0.997 * (1 - amountIn.sellFeesBips / 10000))
   *          = (AB / (B - amountOut / (1 - amountOut.buyFeesBips / 10000)) - A)
   *            /
   *            (0.997 * (1 - amountIn.sellFeesBips / 10000))
   *          = ((AB - AB + A * amountOut / (1 - amountOut.buyFeesBips / 10000)) / (B - amountOut / (1 - amountOut.buyFeesBips / 10000)))
   *            /
   *            (0.997 * (1 - amountIn.sellFeesBips / 10000))
   *          = ((A * amountOut / (1 - amountOut.buyFeesBips / 10000)) / (B - amountOut / (1 - amountOut.buyFeesBips / 10000)))
   *            /
   *            (0.997 * (1 - amountIn.sellFeesBips / 10000))
   *          = ((A * 1000 * amountOut / (1 - amountOut.buyFeesBips / 10000)) / (B - amountOut / (1 - amountOut.buyFeesBips / 10000)))
   *            /
   *            (997 * (1 - amountIn.sellFeesBips / 10000))
   *
   * outputAmountWithTax = amountOut / (1 - amountOut.buyFeesBips / 10000)
   * inputAmountWithTax = amountIn / (997 * (1 - amountIn.sellFeesBips / 10000))
   *                    = (A * outputAmountWithTax * 1000) / ((B - outputAmountWithTax) * 997)
   *
   * @param outputAmount
   */
  public getInputAmount(
    outputAmount: CurrencyAmount<L2Token>,
  ): [CurrencyAmount<L2Token>, Pool] {
    invariant(this.involvesToken(outputAmount.currency), "TOKEN");
    const outputAmountBeforeTax = outputAmount;

    if (
      JSBI.equal(this.reserve0.quotient, ZERO) ||
      JSBI.equal(this.reserve1.quotient, ZERO) ||
      JSBI.greaterThanOrEqual(
        outputAmount.quotient,
        this.reserveOf(outputAmount.currency).quotient,
      ) ||
      JSBI.greaterThanOrEqual(
        outputAmountBeforeTax.quotient,
        this.reserveOf(outputAmount.currency).quotient,
      )
    ) {
      throw new InsufficientReservesError();
    }

    const outputReserve = this.reserveOf(outputAmount.currency);
    const inputReserve = this.reserveOf(
      outputAmount.currency.equals(this.token0) ? this.token1 : this.token0,
    );

    const numerator = JSBI.multiply(
      JSBI.multiply(inputReserve.quotient, outputAmountBeforeTax.quotient),
      FEE_DENOMINATOR,
    );
    const denominator = JSBI.multiply(
      JSBI.subtract(outputReserve.quotient, outputAmountBeforeTax.quotient),
      FEE_NUMERATOR,
    );
    const inputAmount = CurrencyAmount.fromRawAmount(
      outputAmount.currency.equals(this.token0) ? this.token1 : this.token0,
      JSBI.add(JSBI.divide(numerator, denominator), ONE), // add 1 here is part of the formula, no rounding needed here, since there will not be decimal at this point
    );

    const inputAmountBeforeTax = inputAmount;
    return [
      inputAmountBeforeTax,
      new Pool(
        this.poolId,
        inputReserve.add(inputAmount),
        outputReserve.subtract(outputAmount),
      ),
    ];
  }

  public getLiquidityMinted(
    totalSupply: Fraction | bigint,
    tokenAmountA: CurrencyAmount<L2Token>,
    tokenAmountB: CurrencyAmount<L2Token>,
  ): Fraction {
    totalSupply =
      typeof totalSupply === "bigint"
        ? new Fraction(totalSupply.toString())
        : totalSupply;

    const tokenAmounts = tokenAmountA.currency.sortsBefore(
      tokenAmountB.currency,
    ) // does safety checks
      ? ([tokenAmountA, tokenAmountB] as const)
      : ([tokenAmountB, tokenAmountA] as const);
    invariant(
      tokenAmounts[0].currency.equals(this.token0) &&
        tokenAmounts[1].currency.equals(this.token1),
      "TOKEN",
    );

    let liquidity: JSBI;
    if (JSBI.equal(totalSupply.quotient, ZERO)) {
      liquidity = JSBI.subtract(
        sqrt(JSBI.multiply(tokenAmounts[0].quotient, tokenAmounts[1].quotient)),
        MINIMUM_LIQUIDITY,
      );
    } else {
      const amount0 = JSBI.divide(
        JSBI.multiply(tokenAmounts[0].quotient, totalSupply.quotient),
        this.reserve0.quotient,
      );
      const amount1 = JSBI.divide(
        JSBI.multiply(tokenAmounts[1].quotient, totalSupply.quotient),
        this.reserve1.quotient,
      );
      liquidity = JSBI.lessThanOrEqual(amount0, amount1) ? amount0 : amount1;
    }
    if (!JSBI.greaterThan(liquidity, ZERO)) {
      throw new InsufficientInputAmountError();
    }
    return new Fraction(liquidity);
  }

  public getLiquidityValue(
    token: L2Token,
    totalSupply: Fraction,
    liquidity: Fraction,
    feeOn: boolean = false,
    kLast?: BigintIsh,
  ): CurrencyAmount<L2Token> {
    invariant(this.involvesToken(token), "TOKEN");
    invariant(
      JSBI.lessThanOrEqual(liquidity.quotient, totalSupply.quotient),
      "LIQUIDITY",
    );

    let totalSupplyAdjusted: Fraction;
    if (!feeOn) {
      totalSupplyAdjusted = totalSupply;
    } else {
      invariant(!!kLast, "K_LAST");
      const kLastParsed = JSBI.BigInt(kLast);
      if (!JSBI.equal(kLastParsed, ZERO)) {
        const rootK = sqrt(
          JSBI.multiply(this.reserve0.quotient, this.reserve1.quotient),
        );
        const rootKLast = sqrt(kLastParsed);
        if (JSBI.greaterThan(rootK, rootKLast)) {
          const numerator = JSBI.multiply(
            totalSupply.quotient,
            JSBI.subtract(rootK, rootKLast),
          );
          const denominator = JSBI.add(JSBI.multiply(rootK, FIVE), rootKLast);
          const feeLiquidity = JSBI.divide(numerator, denominator);
          totalSupplyAdjusted = totalSupply.add(feeLiquidity);
        } else {
          totalSupplyAdjusted = totalSupply;
        }
      } else {
        totalSupplyAdjusted = totalSupply;
      }
    }

    return CurrencyAmount.fromRawAmount(
      token,
      JSBI.divide(
        JSBI.multiply(liquidity.quotient, this.reserveOf(token).quotient),
        totalSupplyAdjusted.quotient,
      ),
    );
  }
}

export async function getPoolId(
  currencyA: L2Token | string,
  currencyB: L2Token | string,
): Promise<string> {
  const { poseidon2Hash } =
    await import("@aztec-labs/foundation/crypto/poseidon");

  const a = typeof currencyA === "string" ? currencyA : currencyA.address;
  const b = typeof currencyB === "string" ? currencyB : currencyB.address;
  const [currency0, currency1] = tokenAddressSortsBefore(a, b)
    ? [a, b]
    : [b, a];
  const hash: Fr = await poseidon2Hash([BigInt(currency0), BigInt(currency1)]);
  return hash.toString();
}
