"use client";

import { addLiquidityToPools } from "@/lib/blockchain";
import { LoadingButton } from "./LoadingButton";

export function BlockchainControls() {
  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card">
      <h2 className="text-lg font-semibold">Blockchain Controls</h2>
      <div className="flex gap-4">
        <LoadingButton onClick={addLiquidityToPools} variant="default">
          Add liquidity to pools
        </LoadingButton>
      </div>
    </div>
  );
}
