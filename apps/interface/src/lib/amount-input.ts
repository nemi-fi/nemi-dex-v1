import { sutils } from "@nemi-fi/utils";
import type { Currency, CurrencyAmount } from "@uniswap/sdk-core";
import type React from "react";

/**
 * Normalizes what the user typed (or pasted) into an amount field.
 *
 * Accepts digits and a single decimal separator (`,` from locale keyboards is turned into
 * `.`), and at most `maxDecimals` fractional digits. Returns `null` when the edit must be
 * rejected so the field keeps its previous value.
 */
export function sanitizeAmountInput(
  value: string,
  maxDecimals?: number,
): string | null {
  let normalized = value.trim().replace(",", ".");
  if (!/^\d*\.?\d*$/.test(normalized)) {
    return null;
  }
  if (normalized.startsWith(".")) {
    normalized = `0${normalized}`;
  }
  const fraction = normalized.split(".")[1] ?? "";
  if (maxDecimals != null && fraction.length > maxDecimals) {
    return null;
  }
  return normalized;
}

/** True for amounts like "1" or "0.5", false for "", ".", "0" or "0.00". */
export function isPositiveAmount(value: string): boolean {
  return Number(value) > 0;
}

/**
 * Blocks keys that can never be part of an amount. Shortcuts (copy, paste, select all),
 * navigation keys and virtual-keyboard input (reported as "Unidentified") are let through;
 * `sanitizeAmountInput` validates the resulting value.
 */
export function handleAmountKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) {
    return;
  }
  if (!/^[\d.,]$/.test(e.key)) {
    e.preventDefault();
  }
}

/** Parses user input into a token amount, or `undefined` when it isn't a valid amount. */
export function safeParseCurrencyAmount<T extends Currency>(
  token: T | undefined,
  amount: string,
): CurrencyAmount<T> | undefined {
  if (!token || !amount || isNaN(Number(amount))) {
    return undefined;
  }
  try {
    return sutils.parseCurrencyAmount(token, amount);
  } catch {
    return undefined;
  }
}

/** True when `amount` (user input) is more than the loaded `balance`. */
export function exceedsBalance<T extends Currency>(
  token: T | undefined,
  amount: string,
  balance: CurrencyAmount<T> | null | undefined,
): boolean {
  const parsed = safeParseCurrencyAmount(token, amount);
  return Boolean(parsed && balance && parsed.greaterThan(balance));
}
