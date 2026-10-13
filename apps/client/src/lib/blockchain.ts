import { interfaceSdk } from "@nemi-fi/interface-sdk";
import { sutils } from "@nemi-fi/utils";
import ms from "ms";
import { assert } from "ts-essentials";
import { lib } from "./sdk";

export async function addLiquidityToPools() {
  const alice_ = lib.wallet.selectedAccount;
  sutils.assertConnected(alice_);
  const alice = alice_; // typescript quirk

  const prices = {
    BTC: 100_000,
    ETH: 3000,
    SOL: 150,
    AAVE: 200,
    UNI: 6,
  };
  const pools = Object.entries(prices).flatMap(([symbol, price]) => {
    const usdAmount = 100_000_000;
    const params = [
      [symbol, "DAI", usdAmount / price, usdAmount],
      [symbol, "ETH", usdAmount / price, usdAmount / prices["ETH"]],
    ] as const;
    return params.filter(([symbolA, symbolB]) => symbolA !== symbolB);
  });
  for (const [symbolA, symbolB, amountA, amountB] of pools) {
    if (
      !(await deployAndAddLiquidityToPool(
        symbolA,
        symbolB,
        Math.floor(amountA),
        Math.floor(amountB),
        alice,
      ))
    ) {
      break;
    }
  }
}

async function mintInitialBalances(
  initialBalances: {
    to: interfaceSdk.Account;
    amount: any; // CurrencyAmount<L2Token>;
  }[],
) {
  await Promise.all(
    initialBalances.map(async ({ to, amount }) => {
      const tx = await lib.currency.mintPrivate({
        to,
        amount,
      });
      await tx.wait();
    }),
  );
}

async function deployAndAddLiquidityToPool(
  tokenASymbol: string,
  tokenBSymbol: string,
  amountA: number,
  amountB: number,
  account: interfaceSdk.Account,
  { ask = false } = {},
): Promise<boolean> {
  await lib.currencyList.loadCurrenciesOnce();
  const tokenA = lib.currencyList.getCurrencyBySymbol(tokenASymbol);
  const tokenB = lib.currencyList.getCurrencyBySymbol(tokenBSymbol);
  assert(tokenA, `Token ${tokenASymbol} not found`);
  assert(tokenB, `Token ${tokenBSymbol} not found`);

  const pool = await lib.amm.getPoolWithReserves(tokenA, tokenB);
  if (pool.reserve0.greaterThan(0)) {
    // already with liquidity
    return true;
  }

  if (ask) {
    const shouldDeploy = await lib.toast.confirm(
      { confirmText: `Deploy ${tokenASymbol}/${tokenBSymbol} pool?` },
      { icon: "🔄", duration: ms("100 seconds") },
    );

    if (!shouldDeploy) {
      return false;
    }
  }

  const liquidityA = sutils.parseCurrencyAmount(tokenA, amountA);
  const liquidityB = sutils.parseCurrencyAmount(tokenB, amountB);

  const mintForLiquidity = async (liq: any) => {
    // CurrencyAmount<L2Token>
    const bal = await lib.currency.balanceOfPrivate(liq.currency, account);
    if (bal.greaterThan(liq) || bal.equalTo(liq)) {
      return;
    }
    return await mintInitialBalances([
      {
        to: account,
        amount: liq.multiply(10),
      },
    ]);
  };
  await Promise.all([liquidityA, liquidityB].map(mintForLiquidity));

  const tx = await lib.amm.addLiquidity({
    account,
    amountA: liquidityA,
    amountB: liquidityB,
  });
  await tx.wait();
  return true;
}
