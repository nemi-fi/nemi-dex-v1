import { useAccount } from "@/hooks/use-account";
import { useCurrencies } from "@/hooks/use-currencies";
import { interfaceSdk } from "@nemi-fi/interface-sdk";
import type { Pool } from "@nemi-fi/v1-sdk";
import { L2Token } from "@nemi-fi/v1-sdk";
import { useQueries, useQuery } from "@tanstack/react-query";
import ms from "ms";
import { lib } from "./sdk";

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
  const enabled = !!account && !!token;

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
