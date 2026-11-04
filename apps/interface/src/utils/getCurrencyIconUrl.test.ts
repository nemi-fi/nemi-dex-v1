import { interfaceSdk } from "@nemi-fi/interface-sdk";
import { sutils } from "@nemi-fi/utils";
import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";
import { getCurrencyIconUrl } from "./getCurrencyIconUrl.js";

const publicDir = path.join(import.meta.dirname, "../../public");

test.each(Object.values(sutils.supportedAvmChains))(
  "every $name token has an icon",
  async (chain) => {
    const sdk = interfaceSdk.createCore({ chain }, interfaceSdk.testingToast);
    await sdk.currencyList.loadCurrencies();
    const withoutIcon = sdk.currencyList.currencies
      .filter((token) => {
        const url = getCurrencyIconUrl(token);
        return !url || !fs.existsSync(path.join(publicDir, url));
      })
      .map((token) => token.symbol);
    expect(withoutIcon).toEqual([]);
  },
);
