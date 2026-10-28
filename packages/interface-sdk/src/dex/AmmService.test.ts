import { getFeeJuiceBalance } from "@aztec-labs/aztec.js/utils";
import { tokenContract } from "@nemi-fi/contracts";
import { sutils } from "@nemi-fi/utils";
import type { L2Token, Trade } from "@nemi-fi/v1-sdk";
import { type TradeType } from "@uniswap/sdk-core";
import { assert } from "ts-essentials";
import { beforeAll, describe, expect, test } from "vitest";
import { deployAllAndSaveForTokenList } from "../scripts/deploy/deploy-noir.js";
import {
  createCoreForTesting,
  createDex,
  IQuote,
  type Account,
} from "../sdk.js";
import { AmmService } from "./AmmService.js";

describe(AmmService, () => {
  let alice: Account;
  let coreSdk: ReturnType<typeof createCoreForTesting>;
  let dexSdk: ReturnType<typeof createDex>;
  let usdc: L2Token, eth: L2Token;

  beforeAll(async () => {
    coreSdk = createCoreForTesting();
    dexSdk = createDex(coreSdk);

    await deployAllAndSaveForTokenList(coreSdk);

    // alice = await coreSdk.test.deployTestAccount("0x0");
    alice = await coreSdk.deployments.getSponsoredDeployer();
    console.log("alice address", alice.address.toString());
    console.log(
      "alice bal",
      await getFeeJuiceBalance(alice.address, await coreSdk.core.aztecNode()),
    );

    await coreSdk.currencyList.loadCurrenciesOnce();
    usdc = coreSdk.currencyList.getCurrencyBySymbol("DAI")!;
    eth = coreSdk.currencyList.getCurrencyBySymbol("ETH")!;

    await (
      await coreSdk.currency.mintPrivate({
        to: alice,
        amount: sutils.parseCurrencyAmount(usdc, "100000000"),
      })
    ).wait();
    await (
      await coreSdk.currency.mintPrivate({
        to: alice,
        amount: sutils.parseCurrencyAmount(eth, "100000000"),
      })
    ).wait();
  });

  describe("e2e", () => {
    let tokenA: L2Token, tokenB: L2Token;
    beforeAll(async () => {
      tokenA = usdc;
      tokenB = eth;
    });

    test("add initial liquidity", async () => {
      const amountA = sutils.parseCurrencyAmount(tokenA, "1000");
      const amountB = sutils.parseCurrencyAmount(tokenB, "1");
      const pool = await dexSdk.amm.getPoolWithReserves(tokenA, tokenB);
      const balanceABefore = await coreSdk.currency.balanceOfPrivate(
        tokenA,
        alice,
      );
      const balanceBBefore = await coreSdk.currency.balanceOfPrivate(
        tokenB,
        alice,
      );

      const tx = await dexSdk.amm.addLiquidity({
        account: alice,
        amountA,
        amountB,
        deadline: await deadlineFromChainTime(),
      });
      await tx.wait();

      const balanceAAfter = await coreSdk.currency.balanceOfPrivate(
        tokenA,
        alice,
      );
      const balanceBAfter = await coreSdk.currency.balanceOfPrivate(
        tokenB,
        alice,
      );
      const lpBalance = await dexSdk.amm.balanceOfPrivate(pool, alice);
      expect(balanceAAfter).toEqual(balanceABefore.subtract(amountA));
      expect(balanceBAfter).toEqual(balanceBBefore.subtract(amountB));
      // TODO(security): check pool token balances and reserves
      expect(sutils.currencyAmountToBigInt(lpBalance)).toBeGreaterThan(0n);

      const [amount0, amount1] = sutils.sortAmounts(amountA, amountB);
      expect(await dexSdk.amm.getPublicLogs({ txHash: tx.hash })).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            data: expect.objectContaining({
              type: "AddLiquidity",
              amount0,
              amount1,
              liquidity: lpBalance,
            }),
          }),
        ]),
      );

      const txs = await coreSdk.transactionTracker.getTxs(alice);
      expect(txs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            hash: tx.hash.toString(),
            description: expect.stringContaining("to liquidity pool"),
          }),
        ]),
      );
    });

    test.todo("add additional liquidity");

    test("swap", async () => {
      const amountIn = sutils.parseCurrencyAmount(tokenA, "100");
      const currencyOut = tokenB;
      const balanceInBefore = await coreSdk.currency.balanceOfPrivate(
        amountIn.currency,
        alice,
      );

      await coreSdk.currency.balanceOfPrivate(currencyOut, alice); // TODO: remove this. It's a hack to sync balance
      const balanceOutBefore = await coreSdk.currency.balanceOfPrivate(
        currencyOut,
        alice,
      );

      const pools = await dexSdk.amm.loadPools();
      const trade = dexSdk.amm.getBestTradeExactIn({
        amountIn,
        currencyOut,
        pools,
      });
      assert(trade, "no trade found");
      expect(sutils.currencyAmountToBigInt(trade.outputAmount)).toBeGreaterThan(
        sutils.currencyAmountToBigInt(
          sutils.parseCurrencyAmount(currencyOut, "0.09"),
        ),
      ); // sanity check
      const tx = await executeSwap(alice, trade);

      const balanceInAfter = await coreSdk.currency.balanceOfPrivate(
        amountIn.currency,
        alice,
      );
      const balanceOutAfter = await coreSdk.currency.balanceOfPrivate(
        currencyOut,
        alice,
      );
      expect(balanceInAfter).toEqual(balanceInBefore.subtract(amountIn));
      expect(balanceOutAfter).toEqual(balanceOutBefore.add(trade.outputAmount));
      // TODO(security): check pool balances and reserves

      const logs = await dexSdk.amm.getPublicLogs({ txHash: tx.hash });
      expect(logs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            data: expect.objectContaining({
              type: "Swap",
              amountIn: amountIn,
              amountOut: trade.outputAmount,
            }),
          }),
        ]),
      );

      const txs = await coreSdk.transactionTracker.getTxs(alice);
      expect(txs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            hash: tx.hash.toString(),
            description: expect.stringContaining("swap"),
          }),
        ]),
      );
    });

    test("remove liquidity", async () => {
      const balanceABefore = await coreSdk.currency.balanceOfPrivate(
        tokenA,
        alice,
      );
      const balanceBBefore = await coreSdk.currency.balanceOfPrivate(
        tokenB,
        alice,
      );

      const pool = await dexSdk.amm.getPoolWithReserves(tokenA, tokenB);
      assert(pool, "no pool found");
      const amountLp = await dexSdk.amm.balanceOfPrivate(pool, alice);
      assert(amountLp.greaterThan(0), "no liquidity"); // sanity check
      const totalSupplyLp = await dexSdk.amm.totalSupply(pool);
      const amountA = pool.getLiquidityValue(tokenA, totalSupplyLp, amountLp);
      const amountB = pool.getLiquidityValue(tokenB, totalSupplyLp, amountLp);

      const tx = await dexSdk.amm.removeLiquidity({
        account: alice,
        amountLp,
        amountA,
        amountB,
        deadline: await deadlineFromChainTime(),
      });
      await tx.wait();

      const balanceAAfter = await coreSdk.currency.balanceOfPrivate(
        tokenA,
        alice,
      );
      const balanceBAfter = await coreSdk.currency.balanceOfPrivate(
        tokenB,
        alice,
      );
      expect(sutils.currencyAmountToBigInt(balanceAAfter)).toBe(
        sutils.currencyAmountToBigInt(balanceABefore.add(amountA)),
      );
      expect(sutils.currencyAmountToBigInt(balanceBAfter)).toBe(
        sutils.currencyAmountToBigInt(balanceBBefore.add(amountB)),
      );

      const [amount0, amount1] = sutils.sortAmounts(amountA, amountB);
      const logs = await dexSdk.amm.getPublicLogs({ txHash: tx.hash });
      expect(logs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            data: expect.objectContaining({
              type: "RemoveLiquidity",
              amount0,
              amount1,
              liquidity: amountLp,
            }),
          }),
        ]),
      );

      const txs = await coreSdk.transactionTracker.getTxs(alice);
      expect(txs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            hash: tx.hash.toString(),
            description: expect.stringContaining("from liquidity pool"),
          }),
        ]),
      );
    });

    test("constrained simulation", async () => {
      // this test is to test JSON RPC constrained simulation and has nothing to do with the AMM. It was easy to put it here.
      const { result } = await (
        await tokenContract(tokenA, alice, await coreSdk.core.aztecNode())
      ).methods
        .balance_of_public(alice.address)
        .simulate({ from: alice.address });
      expect(result).toBeTypeOf("bigint");
    });
  });

  /**
   * `sutils.deadlineFromNow()` uses the wall clock, but the contract checks the deadline against chain time. On the
   * local network every block advances chain time by a full slot, so after enough txs chain time runs ahead of the
   * wall clock by more than the default TTL. Derive the deadline from the latest block's timestamp instead.
   */
  async function deadlineFromChainTime() {
    const aztecNode = await coreSdk.core.aztecNode();
    const block = await aztecNode.getBlockData("latest");
    assert(block, "latest block not found");
    return (
      block.header.globalVariables.timestamp +
      BigInt(sutils.DEFAULT_DEADLINE_TTL_SECONDS)
    );
  }

  async function executeSwap(
    account: Account,
    trade: Trade<L2Token, L2Token, TradeType.EXACT_INPUT>,
  ) {
    const executeInfo = await dexSdk.amm.getSwapParams({
      account,
      trade,
      deadline: await deadlineFromChainTime(),
    });

    const tx = await sutils.bench(
      "swap",
      await coreSdk.core.aztecNode(),
      async () =>
        await dexSdk.universalRouter.executeQuote(
          account,
          new IQuote(executeInfo, trade.inputAmount, trade.outputAmount),
        ),
    );
    await tx.wait();
    return tx;
  }
});
