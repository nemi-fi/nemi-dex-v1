import { useAccount } from "#/hooks/use-account.js";
import { useCurrencies } from "#/hooks/use-currencies.js";
import { interfaceSdk } from "@nemi-fi/interface-sdk";
import type { Pool } from "@nemi-fi/v1-sdk";
import { L2Token } from "@nemi-fi/v1-sdk";
import { useQueries, useQuery } from "@tanstack/react-query";
import type { CurrencyAmount } from "@uniswap/sdk-core";
import ms from "ms";
import { useMemo } from "react";
import { lib } from "./sdk.js";

export function usePools() {
  return useQuery({
    queryKey: ["pools", lib.core.chain.id],
    queryFn: async () => {
      console.log("loading pools", lib.core.chain.name);
      const pools = await lib.amm.loadPools();
      console.log("loaded pools", pools.length);
      return pools;
    },
  });
}

export function usePoolPositions(
  pools: Pool[] | undefined,
  account: interfaceSdk.Account | undefined,
) {
  return useQuery({
    queryKey: [
      "poolPositions",
      lib.core.chain.id,
      pools?.map((pool) => pool.poolId),
      account?.address.toString().toLowerCase(),
    ],
    queryFn: async () => {
      if (!pools) {
        return null;
      }
      return await Promise.all(
        pools.map((pool) => lib.amm.getPositionInfo(pool, account)),
      );
    },
  });
}

export function useTransactionData() {
  const account = useAccount();
  const enabled = !!account;

  const transactionsQuery = useQuery({
    queryKey: ["wallet-transactions", lib.core.chain.id, account?.address],
    queryFn: async () => {
      if (!enabled) {
        return null;
      }
      const txs = await lib.transactionTracker.getTxs(account);
      return txs;
    },
    enabled,
    refetchInterval: ms("30 sec"),
  });

  return transactionsQuery;
}

export function balanceOptions(
  account: interfaceSdk.Account | undefined,
  token?: L2Token,
) {
  const enabled = !!account && !!token?.address;

  // Use React Query to handle the async operation
  const result = {
    queryKey: [
      "wallet-balance",
      lib.core.chain.id,
      `${account?.address}`,
      token?.address,
    ],
    queryFn: async () => {
      if (!enabled) {
        return null;
      }

      try {
        const balance = await lib.currency.balanceOfPrivate(token, account);
        return balance;
      } catch (error) {
        console.error("Error fetching balance:", error);
        throw error;
      }
    },
    enabled,
    refetchInterval: ms("1 min"),
  };

  return result;
}

export function useBalance(
  account: interfaceSdk.Account | undefined,
  token: L2Token | undefined,
) {
  const result = useQuery(balanceOptions(account, token));
  return result;
}

export function useBalances(account: interfaceSdk.Account | undefined) {
  const currencies = useCurrencies();
  const balances = useQueries({
    queries: currencies.map((currency) => balanceOptions(account, currency)),
  });

  return balances;
}

export function publicBalanceOptions(
  account: interfaceSdk.Account | undefined,
  token?: L2Token,
) {
  const enabled = !!account && !!token?.address;
  return {
    queryKey: [
      "wallet-public-balance",
      lib.core.chain.id,
      `${account?.address}`,
      token?.address,
    ],
    queryFn: async () => {
      if (!enabled) {
        return null;
      }
      return await lib.currency.balanceOfPublic(token, account);
    },
    enabled,
    refetchInterval: ms("1 min"),
  };
}

/** Public balances of all currencies, in the same order as `useBalances`. */
export function usePublicBalances(account: interfaceSdk.Account | undefined) {
  const currencies = useCurrencies();
  return useQueries({
    queries: currencies.map((currency) =>
      publicBalanceOptions(account, currency),
    ),
  });
}

/** A wallet's private and public balance of one token, for the wallet panel. */
export type TokenBalance = {
  private: CurrencyAmount<L2Token>;
  public: CurrencyAmount<L2Token>;
  total: CurrencyAmount<L2Token>;
};

type CombinedQuery<T> =
  | { status: "pending"; data?: undefined; isLoading: boolean }
  | { status: "error"; error: Error; data?: undefined; isLoading: false }
  | { status: "success"; data: T; isLoading: false };

/** Private and public balances of all currencies. Swaps and liquidity spend only private ones. */
export function useWalletBalances(
  account: interfaceSdk.Account | undefined,
): CombinedQuery<TokenBalance | null>[] {
  const privateBalances = useBalances(account);
  const publicBalances = usePublicBalances(account);
  // memoized so `Query` doesn't re-run its error toast effect on every render
  return useMemo(
    () =>
      privateBalances.map((priv, i) =>
        combineBalanceQueries(priv, publicBalances[i]!),
      ),
    [privateBalances, publicBalances],
  );
}

function combineBalanceQueries(
  priv: ReturnType<typeof useBalances>[number],
  pub: ReturnType<typeof usePublicBalances>[number],
): CombinedQuery<TokenBalance | null> {
  const error = priv.error ?? pub.error;
  if (error) {
    return { status: "error", error, isLoading: false };
  }
  if (priv.status === "pending" || pub.status === "pending") {
    return {
      status: "pending",
      isLoading: priv.isLoading || pub.isLoading,
    };
  }
  return {
    status: "success",
    data:
      priv.data && pub.data
        ? {
            private: priv.data,
            public: pub.data,
            total: priv.data.add(pub.data),
          }
        : null,
    isLoading: false,
  };
}
