import type { EventCursor } from "@aztec-labs/aztec.js/events";
import type { TxHash } from "@aztec-labs/aztec.js/tx";
import type {
  AddLiquidity,
  RemoveLiquidity,
  Swap,
} from "@nemi-fi/contracts/contracts";
import { tokenContract } from "@nemi-fi/contracts";
import type { PoolManagerContract } from "@nemi-fi/contracts/contracts";
import { sutils } from "@nemi-fi/utils";
import {
  L2Token,
  MINIMUM_LIQUIDITY,
  Pool,
  Trade,
  type BestTradeOptions,
} from "@nemi-fi/v1-sdk";
import {
  CurrencyAmount,
  Fraction,
  Percent,
  TradeType,
  type Currency,
} from "@uniswap/sdk-core";
import { compact, orderBy } from "lodash-es";
import { assert } from "ts-essentials";
import type {
  Account,
  CoreService,
  CurrencyListService,
  CurrencyService,
  IQuote,
  LoggerService,
  TransactionTrackerService,
} from "../sdk.js";

export type AmmPublicPoolLogData =
  | {
      type: "AddLiquidity";
      amount0: CurrencyAmount<L2Token>;
      amount1: CurrencyAmount<L2Token>;
      liquidity: Fraction;
    }
  | {
      type: "RemoveLiquidity";
      amount0: CurrencyAmount<L2Token>;
      amount1: CurrencyAmount<L2Token>;
      liquidity: Fraction;
    }
  | {
      type: "Swap";
      amountIn: CurrencyAmount<L2Token>;
      amountOut: CurrencyAmount<L2Token>;
    };

export class AmmService {
  static readonly TxType = {
    ADD_LIQUIDITY: 1,
    REMOVE_LIQUIDITY: 2,
    SWAP: 3,
  } as const;

  constructor(
    private core: CoreService,
    private transactionTracker: TransactionTrackerService,
    private currencyList: CurrencyListService,
    private currency: CurrencyService,
    private logger: LoggerService,
  ) {}

  async getPoolManager(account?: Account): Promise<PoolManagerContract> {
    const { PoolManagerContract } =
      await import("@nemi-fi/contracts/contracts");
    account ??= await this.core.getReadonlyAccount();
    const address = await sutils.resolveAztecAddress(
      (await this.core.getDeployments()).PoolManager,
    );
    const node = await this.core.aztecNode();
    const instance = await node.getContract(address);
    assert(instance, `Contract instance for pool manager ${address} not found`);
    await account.wallet.registerContract(
      instance,
      PoolManagerContract.artifact,
    );
    return PoolManagerContract.at(address, account.wallet);
  }

  async addLiquidity({
    account,
    amountA,
    amountB,
    deadline = sutils.deadlineFromNow(),
  }: {
    account: Account;
    amountA: CurrencyAmount<L2Token>;
    amountB: CurrencyAmount<L2Token>;
    /** Unix seconds after which the transaction must no longer be settled. */
    deadline?: bigint;
  }) {
    const { Fr } = await import("@aztec-labs/aztec.js/fields");

    const [amount0, amount1] = sutils.sortAmounts(amountA, amountB);

    // TODO(security): pass amount{0,1}Min as an argument, so it is displayed in the UI before user confirms the transaction
    const amount0Min = calculateSlippageAmount(amount0, SLIPPAGE_TOLERANCE)[0];
    const amount1Min = calculateSlippageAmount(amount1, SLIPPAGE_TOLERANCE)[0];

    const poolManager = await this.getPoolManager(account);
    const pool = await this.getPoolWithReserves(
      amount0.currency,
      amount1.currency,
    );

    const aztecNode = await this.core.aztecNode();
    await this.core.registerContracts(poolManager.wallet, [
      await tokenContract(amount0.currency, account, aztecNode),
      await tokenContract(amount1.currency, account, aztecNode),
    ]);

    const nonce = Fr.random();
    const authWitnesses = await this.core.createAuthWits(
      account,
      await Promise.all([
        this.currency.createTransferAuthWitness({
          method: "transfer_private_to_public_with_commitment",
          owner: account,
          spender: poolManager,
          to: poolManager,
          amount: amount0,
          nonce,
        }),
        this.currency.createTransferAuthWitness({
          method: "transfer_private_to_public_with_commitment",
          owner: account,
          spender: poolManager,
          to: poolManager,
          amount: amount1,
          nonce,
        }),
      ]),
    );
    const liquidityHint = sutils.currencyAmountToBigInt(
      pool.getLiquidityMinted(0n, amount0, amount1).add(MINIMUM_LIQUIDITY), // `getLiquidityMinted` subtracts MINIMUM_LIQUIDITY, so we add it back to get sqrt value
    );
    const desc = `add ${sutils.displayCurrencyAmount(amount0)} + ${sutils.displayCurrencyAmount(amount1)} to liquidity pool`;
    const tx = await sutils.bench("addLiquidity", aztecNode, async () =>
      this.transactionTracker.trackWithAccount(
        account,
        poolManager.methods
          .add_liquidity(
            await sutils.resolveAztecAddress(amount0.currency),
            await sutils.resolveAztecAddress(amount1.currency),
            sutils.currencyAmountToBigInt(amount0),
            sutils.currencyAmountToBigInt(amount1),
            sutils.currencyAmountToBigInt(amount0Min),
            sutils.currencyAmountToBigInt(amount1Min),
            nonce,
            liquidityHint,
            deadline,
          )
          .with({ authWitnesses }),
        desc,
      ),
    );
    return tx;
  }

  async removeLiquidity({
    account,
    amountLp,
    amountA,
    amountB,
    deadline = sutils.deadlineFromNow(),
  }: {
    account: Account;
    amountLp: Fraction;
    amountA: CurrencyAmount<L2Token>;
    amountB: CurrencyAmount<L2Token>;
    /** Unix seconds after which the transaction must no longer be settled. */
    deadline?: bigint;
  }) {
    const poolManager = await this.getPoolManager(account);

    const [amount0, amount1] = sutils.sortAmounts(amountA, amountB);
    // TODO(security): pass amount{0,1}Min as an argument, so it is displayed in the UI before user confirms the transaction
    const amount0Min = calculateSlippageAmount(amount0, SLIPPAGE_TOLERANCE)[0];
    const amount1Min = calculateSlippageAmount(amount1, SLIPPAGE_TOLERANCE)[0];

    const aztecNode = await this.core.aztecNode();
    await this.core.registerContracts(poolManager.wallet, [
      await tokenContract(amount0.currency, account, aztecNode),
      await tokenContract(amount1.currency, account, aztecNode),
    ]);

    const desc = `remove ${sutils.displayCurrencyAmount(amount0)} & ${sutils.displayCurrencyAmount(amount1)} from liquidity pool`;
    const tx = await sutils.bench("removeLiquidity", aztecNode, async () =>
      this.transactionTracker.trackWithAccount(
        account,
        poolManager.methods.remove_liquidity(
          await sutils.resolveAztecAddress(amount0.currency),
          await sutils.resolveAztecAddress(amount1.currency),
          sutils.currencyAmountToBigInt(amountLp),
          sutils.currencyAmountToBigInt(amount0Min),
          sutils.currencyAmountToBigInt(amount1Min),
          deadline,
        ),
        desc,
      ),
    );
    return tx;
  }

  async getPositionInfo(
    pool: Pool,
    account: Account | undefined,
  ): Promise<PoolPosition> {
    const { lpTotalSupply, lpBalance } = await sutils.promiseAllObject({
      lpTotalSupply: await this.totalSupply(pool),
      lpBalance: account
        ? this.balanceOfPrivate(pool, account)
        : new Fraction(0),
    });

    const [myPooled0, myPooled1] = lpTotalSupply.equalTo(0)
      ? [
          CurrencyAmount.fromRawAmount(pool.token0, 0),
          CurrencyAmount.fromRawAmount(pool.token1, 0),
        ]
      : [
          pool.getLiquidityValue(pool.token0, lpTotalSupply, lpBalance),
          pool.getLiquidityValue(pool.token1, lpTotalSupply, lpBalance),
        ];

    const myShare = new Percent(lpBalance.quotient, lpTotalSupply.quotient);

    return { pool, myShare, lpBalance, lpTotalSupply, myPooled0, myPooled1 };
  }

  getBestTradeExactIn({ amountIn, currencyOut, pools }: SwapInput) {
    const trade = Trade.bestTradeExactIn(
      pools,
      amountIn,
      currencyOut,
      TRADE_OPTIONS,
    )[0];
    return trade;
  }

  async getSwapParams({
    account,
    trade,
    deadline = sutils.deadlineFromNow(),
  }: {
    account: sutils.AztecAddressable | undefined;
    trade: Trade<L2Token, L2Token, TradeType.EXACT_INPUT>;
    /** Unix seconds after which the transaction must no longer be settled. */
    deadline?: bigint;
  }): Promise<IQuote["executeInfo"]> {
    const { Fr } = await import("@aztec-labs/aztec.js/fields");

    const someAccount = await this.core.getReadonlyAccount();
    const poolManager = await this.getPoolManager();

    const params = {
      amountIn: trade.inputAmount,
      amountOutMin: trade.minimumAmountOut(SLIPPAGE_TOLERANCE),
      path: await Promise.all(
        trade.route.path.map((token) =>
          sutils.resolveAztecAddress(token.wrapped),
        ),
      ),
      nonce: Fr.random(),
    };
    assert(params.amountOutMin.greaterThan(0), "invalid amount out");

    const aztecNode = await this.core.aztecNode();
    await this.core.registerContracts(poolManager.wallet, [
      await tokenContract(params.amountIn.currency, someAccount, aztecNode),
      await tokenContract(params.amountOutMin.currency, someAccount, aztecNode),
    ]);

    const allowanceIntents = account
      ? [
          await this.currency.createTransferAuthWitness({
            method: "transfer_private_to_public",
            owner: account,
            spender: await sutils.resolveAztecAddress(poolManager),
            to: await sutils.resolveAztecAddress(poolManager),
            amount: params.amountIn,
            nonce: params.nonce,
          }),
        ]
      : [];

    const call = await poolManager.methods
      .swap_exact_tokens_for_tokens(
        sutils.currencyAmountToBigInt(params.amountIn),
        sutils.currencyAmountToBigInt(params.amountOutMin),
        params.path,
        params.nonce,
        deadline,
      )
      .getFunctionCall();

    return {
      calls: [call],
      allowanceIntents,
    };
  }

  async getPoolWithReserves(tokenA: L2Token, tokenB: L2Token) {
    const poolManager = await this.getPoolManager();
    const [token0, token1] = sutils.sortTokens(tokenA, tokenB);

    const { result } = await poolManager.methods
      .get_reserves(
        await sutils.resolveAztecAddress(token0),
        await sutils.resolveAztecAddress(token1),
      )
      .simulate({
        from: (await this.core.getReadonlyAccount()).address,
      });
    const typed = result as [bigint, bigint];
    const [reserve0, reserve1] = typed;

    return await Pool.new(
      sutils.bigIntToCurrencyAmount(token0, reserve0),
      sutils.bigIntToCurrencyAmount(token1, reserve1),
    );
  }

  async loadPools() {
    await this.currencyList.loadCurrenciesOnce();
    const tokens = this.currencyList.currencies;
    const maybePools = await Promise.all(
      tokens.map((tokenA) =>
        Promise.all(
          tokens.map((tokenB) =>
            !tokenA.equals(tokenB) && tokenA.sortsBefore(tokenB)
              ? this.getPoolWithReserves(tokenA, tokenB)
              : undefined,
          ),
        ),
      ),
    );
    const pools = compact(maybePools.flat());
    return orderBy(pools, (pool) => pool.reserve0.equalTo(0)); // show pools with liquidity first
  }

  async totalSupply(pool: Pool) {
    const poolManager = await this.getPoolManager();
    const { result: raw } = await poolManager.methods
      .total_supply(BigInt(pool.poolId))
      .simulate({ from: (await this.core.getReadonlyAccount()).address });
    return new Fraction(raw.toString());
  }

  async balanceOfPrivate(pool: Pool, account: Account) {
    const poolManager = await this.getPoolManager(account);
    const { result: raw } = await poolManager.methods
      .balance_of_private(BigInt(pool.poolId), account)
      .simulate({ from: account.address });
    return new Fraction(raw.toString());
  }

  async getPublicLogs({ txHash }: { txHash?: TxHash } = {}): Promise<
    { data: AmmPublicPoolLogData }[]
  > {
    const poolManager = await this.getPoolManager();
    const node = await this.core.aztecNode();
    const { PoolManagerContract } =
      await import("@nemi-fi/contracts/contracts");
    const { getPublicEvents } = await import("@aztec-labs/aztec.js/events");

    const filter = {
      contractAddress: poolManager.address,
      ...(txHash != null ? { txHash } : {}),
    };

    await this.currencyList.loadCurrenciesOnce();

    // `getPublicEvents` returns at most one page (the node's per-tag page size), so follow
    // `nextCursor` until it is absent or the whole history is silently truncated.
    const getAllPublicEvents = async <T>(
      eventMetadataDef: Parameters<typeof getPublicEvents>[1],
    ): Promise<T[]> => {
      const all: T[] = [];
      let afterEvent: EventCursor | undefined;
      do {
        const page = await getPublicEvents<T>(node, eventMetadataDef, {
          ...filter,
          ...(afterEvent != null ? { afterEvent } : {}),
        });
        all.push(...page.events.map(({ event }) => event));
        afterEvent = page.nextCursor;
      } while (afterEvent != null);
      return all;
    };

    const [addEvents, remEvents, swapEvents] = await Promise.all([
      getAllPublicEvents<AddLiquidity>(PoolManagerContract.events.AddLiquidity),
      getAllPublicEvents<RemoveLiquidity>(
        PoolManagerContract.events.RemoveLiquidity,
      ),
      getAllPublicEvents<Swap>(PoolManagerContract.events.Swap),
    ]);

    const out: { data: AmmPublicPoolLogData }[] = [];

    for (const event of addEvents) {
      const data = this.#mapAddLiquidityEvent(event);
      if (data) {
        out.push({ data });
      }
    }
    for (const event of remEvents) {
      const data = this.#mapRemoveLiquidityEvent(event);
      if (data) {
        out.push({ data });
      }
    }
    for (const event of swapEvents) {
      const data = this.#mapSwapEvent(event);
      if (data) {
        out.push({ data });
      }
    }

    return out;
  }

  #fieldAddressToString(addr: string | { toString(): string }): string {
    return typeof addr === "string" ? addr : addr.toString();
  }

  #mapAddLiquidityEvent(event: AddLiquidity) {
    const token0 = this.currencyList.getCurrency(
      this.#fieldAddressToString(event.token0),
    );
    const token1 = this.currencyList.getCurrency(
      this.#fieldAddressToString(event.token1),
    );
    if (!token0 || !token1) {
      this.logger.error(
        "token not found",
        this.#fieldAddressToString(event.token0),
        this.#fieldAddressToString(event.token1),
      );
      return undefined;
    }
    const amount0 = sutils.bigIntToCurrencyAmount(
      token0,
      BigInt(event.amount0),
    );
    const amount1 = sutils.bigIntToCurrencyAmount(
      token1,
      BigInt(event.amount1),
    );
    const liquidity = new Fraction(event.liquidity.toString());
    return {
      type: "AddLiquidity",
      amount0,
      amount1,
      liquidity,
    } as const;
  }

  #mapRemoveLiquidityEvent(event: RemoveLiquidity) {
    const token0 = this.currencyList.getCurrency(
      this.#fieldAddressToString(event.token0),
    );
    const token1 = this.currencyList.getCurrency(
      this.#fieldAddressToString(event.token1),
    );
    if (!token0 || !token1) {
      this.logger.error(
        "token not found",
        this.#fieldAddressToString(event.token0),
        this.#fieldAddressToString(event.token1),
      );
      return undefined;
    }
    const amount0 = sutils.bigIntToCurrencyAmount(
      token0,
      BigInt(event.amount0),
    );
    const amount1 = sutils.bigIntToCurrencyAmount(
      token1,
      BigInt(event.amount1),
    );
    const liquidity = new Fraction(event.liquidity.toString());
    return {
      type: "RemoveLiquidity",
      amount0,
      amount1,
      liquidity,
    } as const;
  }

  #mapSwapEvent(event: Swap) {
    const tokenIn = this.currencyList.getCurrency(
      this.#fieldAddressToString(event.token_in),
    );
    const tokenOut = this.currencyList.getCurrency(
      this.#fieldAddressToString(event.token_out),
    );
    if (!tokenIn || !tokenOut) {
      this.logger.error(
        "token not found",
        this.#fieldAddressToString(event.token_in),
        this.#fieldAddressToString(event.token_out),
      );
      return undefined;
    }
    const amountIn = sutils.bigIntToCurrencyAmount(
      tokenIn,
      BigInt(event.amount_in),
    );
    const amountOut = sutils.bigIntToCurrencyAmount(
      tokenOut,
      BigInt(event.amount_out),
    );
    return {
      type: "Swap",
      amountIn,
      amountOut,
    } as const;
  }
}

export interface PoolPosition {
  pool: Pool;
  myShare: Percent;
  lpBalance: Fraction;
  lpTotalSupply: Fraction;
  myPooled0: CurrencyAmount<L2Token>;
  myPooled1: CurrencyAmount<L2Token>;
}

const TRADE_OPTIONS: BestTradeOptions = {
  maxHops: 1, // limited by aztec
};

// TODO(security): allow user to configure slippage tolerance
export const SLIPPAGE_TOLERANCE = new Percent(5, 1000);

type SwapInput = {
  amountIn: CurrencyAmount<L2Token>;
  currencyOut: L2Token;
  pools: Pool[];
};

export type SwapParams = Awaited<ReturnType<AmmService["getSwapParams"]>>;
export function quoteLiquidity({
  amountA,
  pool,
}: {
  amountA: CurrencyAmount<L2Token>;
  pool: Pool;
}) {
  if (pool.reserve0.equalTo(0) || pool.reserve1.equalTo(0)) {
    return undefined;
  }
  const price = pool.priceOf(amountA.currency);
  return price.quote(amountA);
}

function calculateSlippageAmount<T extends Currency>(
  value: CurrencyAmount<T>,
  slippage: Percent,
): [CurrencyAmount<T>, CurrencyAmount<T>] {
  const ONE = new Fraction(1, 1);

  if (slippage.lessThan(0) || slippage.greaterThan(ONE)) {
    throw new Error("Unexpected slippage");
  }
  return [
    value.multiply(ONE.subtract(slippage)),
    value.multiply(ONE.add(slippage)),
  ];
}
