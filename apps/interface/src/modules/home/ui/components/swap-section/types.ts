import { L2Token } from "@nemi-fi/v1-sdk";
import React from "react";

// Core token data from SDK
export type Token = {
  /** `undefined` for the placeholder shown until the currency list loads. */
  l2Token: L2Token | undefined;
  id: string;
  name: string;
  symbol: string;
  logo: React.ReactElement | string;
};
