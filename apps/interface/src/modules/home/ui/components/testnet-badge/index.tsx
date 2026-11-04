"use client";

import { useIsTestnet } from "#/hooks/use-is-testnet.js";
import { cn } from "#/lib/utils.js";

/** ALPHA on mainnet, TESTNET on testnet (click for the testnet notice, loaded on demand). */
export const TestnetBadge = () => {
  const isTestnet = useIsTestnet();
  if (isTestnet === undefined) return null;

  const label = (
    <span className="flex items-center gap-1 rounded-md border border-white/10 bg-[#c2416c] px-1.5 py-0.5 text-[9px] font-medium tracking-wider text-white shadow-sm backdrop-blur-sm transition-all select-none group-hover:bg-[#c2416c]/90">
      <span className="relative mr-0.5 flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-white opacity-70"></span>
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white"></span>
      </span>
      {isTestnet ? "TESTNET" : "ALPHA"}
    </span>
  );

  return isTestnet ? (
    <button
      type="button"
      onClick={() =>
        void import("../testnet-modal/index.js").then((m) =>
          m.showTestnetModal(),
        )
      }
      className="group relative inline-flex cursor-pointer items-center transition-transform hover:scale-105 active:scale-95"
    >
      {label}
    </button>
  ) : (
    <span
      className={cn(
        "group relative inline-flex items-center transition-transform hover:scale-105",
      )}
    >
      {label}
    </span>
  );
};
