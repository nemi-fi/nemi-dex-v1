import { lib } from "#/lib/sdk.js";
import type { interfaceSdk } from "@nemi-fi/interface-sdk";
import { sutils } from "@nemi-fi/utils";
import { useQuery } from "@tanstack/react-query";

export function useAccount(): interfaceSdk.Account | undefined {
  // return useSvelte(() => lib.wallet.selectedAccount); // this does not update when the account changes for some reason
  const queriedAccount = useQuery({
    queryKey: ["a-hack-queried-account"],
    queryFn: () => lib.wallet.selectedAccount ?? null,
    refetchInterval: sutils.ms("0.1 sec"),
  });
  return queriedAccount.data ?? undefined;
}
