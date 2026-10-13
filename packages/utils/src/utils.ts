import type { AztecAddress } from "@aztec/aztec.js/addresses";
import type { FeePaymentMethod } from "@aztec/aztec.js/fee";
import type { AztecNode } from "@aztec/aztec.js/node";
import type { TxHash, TxReceipt } from "@aztec/aztec.js/tx";
import type { AccountManager, Wallet } from "@aztec/aztec.js/wallet";
import {
  CurrencyAmount,
  Fraction,
  Percent,
  Price,
  type Currency,
  type Token,
} from "@uniswap/sdk-core";
import ms from "ms";
import { assert, UnreachableCaseError, type AsyncOrSync } from "ts-essentials";
import { formatUnits, parseUnits } from "viem";
import { z } from "zod";
import type { AvmChain } from "./chains.js";
import type { AztecAddressable } from "./types.js";

export * as svelte from "./svelte.js";

export { ms };

export const AZTEC_TX_WAIT_TIMEOUT = /*#__PURE__*/ Math.floor(
  ms("1 day") / 1000,
);

export function sleep(milliseconds: number | ms.StringValue): Promise<void> {
  const millisNum =
    typeof milliseconds === "string" ? ms(milliseconds) : milliseconds;
  return new Promise((resolve) => setTimeout(resolve, millisNum));
}

export function iife<T>(fn: () => T): T {
  return fn();
}

export function shortenAddress(address: string | AztecAddress): string {
  const addr = typeof address === "string" ? address : address.toString();
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function shortenTxHash(hash: string | TxHash): string {
  hash = hash.toString();
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

export function isAddressEqual(
  a: string | AztecAddress,
  b: string | AztecAddress,
): boolean {
  return a.toString().toLowerCase() === b.toString().toLowerCase();
}

export function errorToString(error: any): string {
  return String(error?.message || error);
}

export function lazyValue<T>(fn: () => T) {
  let value: T;
  let initialized = false;
  const ret = () => {
    if (!initialized) {
      initialized = true;
      value = fn();
    }
    return value;
  };
  ret.maybeValue = ():
    { initialized: true; value: T } | { initialized: false } =>
    initialized ? { initialized, value } : { initialized };
  return ret;
}

export async function promiseAllObject<
  T extends Record<keyof object, AsyncOrSync<unknown>>,
>(obj: T): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  const entries = Object.entries(obj);
  const results = await Promise.all(
    entries.map(async ([key, value]) =>
      Promise.resolve(value).then((v) => [key, v]),
    ),
  );
  return Object.fromEntries(results);
}

export async function resolveAztecAddress(
  address: AztecAddressable,
): Promise<AztecAddress> {
  const { AztecAddress } = await import("@aztec/aztec.js/addresses");
  let a;
  if (typeof address === "object" && "address" in address) {
    a = address.address;
  } else if (typeof address === "object" && "getAddress" in address) {
    a = address.getAddress();
  } else {
    a = address;
  }
  const resolved = typeof a === "string" ? AztecAddress.fromStringUnsafe(a) : a;
  // `fromStringUnsafe` only parses the hex; since Aztec v5 checking that it is a real
  // address (a point on the Grumpkin curve, which is what lets it be encrypted to) is a
  // separate step.
  assert(await resolved.isValid(), `invalid Aztec address: ${resolved}`);
  return resolved;
}

export function displayPercent(x: Percent): string {
  return `${x.toFixed(2)}%`;
}

export function displayPrice(price: Price<Currency, Currency>) {
  return `${price.toSignificant()} ${price.quoteCurrency.symbol}/${price.baseCurrency.symbol}`;
}

function parseUnitsInternal(value: string, decimals: number) {
  let rawAmount: bigint;
  try {
    rawAmount = parseUnits(value, decimals);
  } catch (e) {
    throw new Error(`${value} is too small or too large.`);
  }
  if (rawAmount === 0n && Number(value) !== 0) {
    throw new Error(`${value} is too small`);
  }
  return rawAmount;
}

/**
 * Converts user input to a CurrencyAmount. Takes into account the token's decimals.
 * E.g., for a token with 9 decimals, `"1.23"` becomes `CurrencyAmount(1230000000)`.
 */
export function parseCurrencyAmount<T extends Currency>(
  token: T,
  userAmount: string | number,
): CurrencyAmount<T> {
  userAmount =
    typeof userAmount === "number" ? userAmount.toString() : userAmount;
  const rawAmount = parseUnitsInternal(userAmount, token.decimals);
  return bigIntToCurrencyAmount(token, rawAmount);
}

/**
 * Converts a CurrencyAmount to a string that can be used in calculations.
 */
export function formatCurrencyAmount(amount: CurrencyAmount<Currency>): string {
  return formatUnits(currencyAmountToBigInt(amount), amount.currency.decimals);
}

/**
 * # Only for display purposes, not for calculations. Truncates the amount to significant digits.
 */
export function displayCurrencyAmount(
  amount: CurrencyAmount<Currency>,
  { symbolPosition = "end" }: { symbolPosition?: "start" | "end" | false } = {},
): string {
  const amountString = amount.lessThan(
    parseCurrencyAmount(amount.currency, "1"),
  )
    ? amount.equalTo(0)
      ? amount.toFixed(0)
      : amount.toExact()
    : Number.isInteger(Number(amount.toExact()))
      ? amount.toFixed(0)
      : amount.toFixed(4);
  const symbol = amount.currency.symbol;
  switch (symbolPosition) {
    case "start":
      return `${symbol} ${amountString}`;
    case "end":
      return `${amountString} ${symbol}`;
    case false:
      return amountString;
    default:
      throw new UnreachableCaseError(symbolPosition);
  }
}

export function currencyAmountMin<T extends Currency>(
  a: CurrencyAmount<T>,
  b: CurrencyAmount<T>,
): CurrencyAmount<T> {
  assert(
    a.currency.equals(b.currency),
    `min: CURRENCIES (${a.currency.symbol} !== ${b.currency.symbol})`,
  );
  return a.lessThan(b) ? a : b;
}

export function sumCurrencyAmounts<T extends Currency>(
  amounts: CurrencyAmount<T>[],
  currency: T,
): CurrencyAmount<T> {
  return amounts.reduce(
    (sum, amount) => sum.add(amount),
    CurrencyAmount.fromRawAmount(currency, 0),
  );
}

export function arrayPadEnd<T>(
  array: T[],
  targetLength: number,
  padValue: T,
): T[] {
  assert(array.length <= targetLength, "arrayPadEnd: array too long");
  const newArray = array.slice();
  while (newArray.length < targetLength) {
    newArray.push(padValue);
  }
  return newArray;
}

export function bufferPadEnd(buffer: Buffer, targetLength: number): Buffer {
  assert(buffer.length <= targetLength, "bufferPadEnd: buffer too long");
  const newBuffer = Buffer.alloc(targetLength);
  buffer.copy(newBuffer);
  return newBuffer;
}

/** Default time-to-live for an AMM transaction's `deadline`, in seconds. */
export const DEFAULT_DEADLINE_TTL_SECONDS = 20 * 60;

/**
 * Returns a unix-seconds deadline `ttlSeconds` from now, for the AMM's `deadline` arguments.
 *
 * A transaction that only reaches public execution after its deadline reverts with `NemiV1: EXPIRED` instead of being
 * settled against a pool that has moved in the meantime.
 */
export function deadlineFromNow(
  ttlSeconds: number = DEFAULT_DEADLINE_TTL_SECONDS,
): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + ttlSeconds);
}

export function sortTokens<T extends { address: string | AztecAddress }>(
  tokenA: T,
  tokenB: T,
): readonly [T, T] {
  if (
    tokenA.address.toString().toLowerCase() >
    tokenB.address.toString().toLowerCase()
  ) {
    return [tokenB, tokenA];
  }
  return [tokenA, tokenB];
}

export function sortAmounts<T extends Token>(
  amountA: CurrencyAmount<T>,
  amountB: CurrencyAmount<T>,
): readonly [CurrencyAmount<T>, CurrencyAmount<T>] {
  const [token0] = sortTokens(amountA.currency, amountB.currency);
  return token0.equals(amountA.currency)
    ? [amountA, amountB]
    : [amountB, amountA];
}

export function currencyAmountToBigInt(
  x: CurrencyAmount<Currency> | Fraction,
): bigint {
  return BigInt(x.quotient.toString());
}

export function bigIntToCurrencyAmount<C extends Currency>(
  currency: C,
  amount: bigint,
): CurrencyAmount<C> {
  return CurrencyAmount.fromRawAmount(currency, amount.toString());
}

export function assertConnected<T>(
  account: T | undefined | null,
): asserts account is T {
  assert(account, "Wallet not connected");
}

export async function ensureAccountDeployed(
  accountManager: AccountManager,
  node: AztecNode,
  paymentMethod?: FeePaymentMethod,
  toast?: {
    promise: <T>(
      promise: Promise<T>,
      msgs: {
        loading: string;
        success: string;
        error: (error: unknown) => string;
      },
    ) => Promise<T>;
  },
) {
  const isDeployable: boolean = await accountManager.hasInitializer();
  if (isDeployable) {
    const isDeployed: boolean = await isAccountDeployed(accountManager);
    if (!isDeployed) {
      const { NO_FROM } = await import("@aztec/aztec.js/account");
      const { waitForTx } = await import("@aztec/aztec.js/node");
      const { NO_WAIT } = await import("@aztec/aztec.js/contracts");
      const txHashPromise = (await accountManager.getDeployMethod()).send({
        from: NO_FROM,
        fee: { paymentMethod },
        wait: NO_WAIT,
      });

      await toast?.promise(txHashPromise, {
        loading:
          "Generating a ZK proof to create your account (allow up to 2 minutes)...",
        success: "Account creation tx sent!",
        error: (error) =>
          `Error generating a ZK proof for account: ${errorToString(error)}`,
      });
      const { txHash } = await txHashPromise;
      const waitPromise = waitForTx(node, txHash, {
        timeout: AZTEC_TX_WAIT_TIMEOUT,
      });
      await toast?.promise(waitPromise, {
        loading: "Confirming your account on-chain...",
        success: "Account created",
        error: (error) =>
          `Error confirming your account on-chain: ${errorToString(error)}`,
      });

      await waitPromise; // because toast is optional
      console.log("Account created");
    }
  }
  return await registerAccount(accountManager);
}

export async function registerAccount(
  accountManager: AccountManager,
): Promise<WalletAccount> {
  const wallet = getWalletFromAccountManager(accountManager);
  await wallet.registerContract(
    accountManager.getInstance(),
    await accountManager.getAccountContract().getContractArtifact(),
    accountManager.getSecretKey(),
  );
  return {
    wallet,
    address: accountManager.address,
  };
}

function getWalletFromAccountManager(accountManager: AccountManager): Wallet {
  return (accountManager as any).wallet;
}

export async function isAccountDeployed(accountManager: AccountManager) {
  const { ContractInitializationStatus } =
    await import("@aztec/aztec.js/wallet");
  const wallet = getWalletFromAccountManager(accountManager);
  const { initializationStatus } = await wallet.getContractMetadata(
    await resolveAztecAddress(accountManager),
  );
  return initializationStatus === ContractInitializationStatus.INITIALIZED;
}

export interface WalletAccount {
  readonly wallet: Wallet;
  readonly address: AztecAddress;
}

export async function createAztecNode<C extends AvmChain>(
  chain: C,
): Promise<EnhancedAztecNode<C>> {
  const { createAztecNodeClient } = await import("@aztec/aztec.js/node");
  const node = createAztecNodeClient(chain.rpcUrls.default.http[0]);
  return Object.assign(node, { chain });
}

export interface EnhancedAztecNode<
  C extends AvmChain = AvmChain,
> extends AztecNode {
  readonly chain: C;
}

export async function createIsomorphicTestWallet(node: EnhancedAztecNode) {
  const { EmbeddedWallet } = await import("@aztec/wallets/embedded");

  return await EmbeddedWallet.create(node, {
    pxeConfig: {
      proverEnabled: node.chain.proverEnabled,
      dataDirectory: "pxe-data",
    },
  });
}

export function zAztecAddress() {
  return z.string().regex(/^0x[0-9a-fA-F]{64}$/i);
}

export function zStringBigInt() {
  return z
    .string()
    .regex(/^[0-9]+$/, "must be a valid big int")
    .transform((s) => BigInt(s));
}

export function valuesToLiteralUnion<T extends string | number | boolean>(
  values: readonly T[],
) {
  if (values.length === 0) {
    throw new Error("Cannot create Zod union from empty array");
  }

  const literals = values.map((v) => z.literal(v));

  type L = (typeof literals)[number];
  return z.union(literals as [L, L, ...L[]]);
}

export function removePrefixOrThrow(s: string, prefix: string) {
  if (!s.startsWith(prefix)) {
    throw new Error(`String does not start with prefix: ${prefix}`);
  }
  return s.slice(prefix.length);
}

export type PromiseWithResolvers<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
};

export function promiseWithResolvers<T>(): PromiseWithResolvers<T> {
  const ret = {} as PromiseWithResolvers<T>;
  ret.promise = new Promise((resolve, reject) => {
    ret.resolve = resolve;
    ret.reject = reject;
  });
  return ret;
}

export interface TxLike {
  hash: TxHash;
  wait: () => Promise<TxReceipt>;
}
export async function bench(
  name: string,
  node: AztecNode,
  fn: () => Promise<TxHash | TxLike>,
): Promise<TxLike> {
  const { waitForTx } = await import("@aztec/aztec.js/node");
  const { TxHash } = await import("@aztec/aztec.js/tx");

  const start = Date.now();
  console.log(`${name} start`);
  let hash = await fn();
  console.log(`${name} sent: ${Date.now() - start}`);

  if (!(hash instanceof TxHash)) {
    hash = hash.hash;
  }

  const waitStart = Date.now();
  const waitPromise = waitForTx(node, hash).then((receipt) => {
    console.log(`${name} confirmed: ${Date.now() - waitStart}`);
    return receipt;
  });
  return {
    wait: () => waitPromise,
    hash,
  };
}

const LIQ_DECIMALS = 9; // TODO: change to 18 when all tokens will use 18 decimals
// TODO: nuke this function
/**
 * # Only for display purposes, not for calculations. Truncates the amount to significant digits.
 */
export function displayLiquidityBalance(bal: Fraction) {
  return bal.divide((10n ** BigInt(LIQ_DECIMALS)).toString()).toSignificant(4);
}

export function formatLiquidityBalance(balance: Fraction) {
  return formatUnits(currencyAmountToBigInt(balance), LIQ_DECIMALS);
}

// TODO: nuke this function
export function parseLiquidityBalance(input: string) {
  const raw = parseUnitsInternal(input, LIQ_DECIMALS);
  return new Fraction(raw.toString());
}

export async function collectAsyncIterable<T>(
  iterable: AsyncIterable<T>,
): Promise<T[]> {
  const ret: T[] = [];
  for await (const item of iterable) {
    ret.push(item);
  }
  return ret;
}
