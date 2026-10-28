import { L2Token } from "@nemi-fi/v1-sdk";
import React from "react";

// Core token data from SDK
export type Token = {
  l2Token: L2Token; // Original token data from SDK
  id: string;
  name: string;
  symbol: string;
  logo: React.ReactElement | string;
  usdPrice: number;
};
