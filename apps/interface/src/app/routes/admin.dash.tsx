"use client";

import { Query } from "#/components/Query.js";
import { lib } from "#/lib/sdk.js";
import { sutils } from "@nemi-fi/utils";
import { useQuery } from "@tanstack/react-query";

export default function () {
  const logs = useQuery({
    queryKey: ["amm-logs"],
    queryFn: async () => {
      return await lib.amm.getPublicLogs();
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Transactions</h1>
      <Query query={logs}>
        {(logs) => {
          return (
            <div>
              <ol className="list-decimal list-inside">
                {logs.map((log, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    {sutils.iife(() => {
                      switch (log.data.type) {
                        case "Swap":
                          return (
                            <span>
                              Swap{" "}
                              {sutils.displayCurrencyAmount(log.data.amountIn)}{" "}
                              for{" "}
                              {sutils.displayCurrencyAmount(log.data.amountOut)}
                            </span>
                          );
                        case "AddLiquidity":
                          return (
                            <span>
                              Add Liquidity{" "}
                              {sutils.displayCurrencyAmount(log.data.amount0)} &{" "}
                              {sutils.displayCurrencyAmount(log.data.amount1)}
                            </span>
                          );
                        case "RemoveLiquidity":
                          return (
                            <span>
                              Remove Liquidity{" "}
                              {sutils.displayCurrencyAmount(log.data.amount0)} &{" "}
                              {sutils.displayCurrencyAmount(log.data.amount1)}
                            </span>
                          );
                        default:
                          log.data satisfies never;
                      }
                    })}
                  </li>
                ))}
              </ol>
            </div>
          );
        }}
      </Query>
    </div>
  );
}
