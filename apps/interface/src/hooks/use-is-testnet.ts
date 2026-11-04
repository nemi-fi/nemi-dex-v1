"use client";

import { currentChainName } from "#/lib/chain-name.js";
import { useEffect, useState } from "react";

/**
 * Whether the app is connected to Aztec testnet (or a local network). Read after mount because the
 * chain is persisted in localStorage, so it is `undefined` until then. Reads the stored chain
 * directly instead of through the SDK, so the header badge doesn't load the SDK on every page.
 */
export function useIsTestnet() {
  const [isTestnet, setIsTestnet] = useState<boolean>();

  useEffect(() => {
    setIsTestnet(currentChainName() !== "mainnet");
  }, []);

  return isTestnet;
}
