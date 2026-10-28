import type { FunctionCall } from "@aztec-labs/aztec.js/abi";
import type { AztecAddress } from "@aztec-labs/aztec.js/addresses";
import type { CallIntent } from "@aztec-labs/aztec.js/authorization";
import type { InteractionFeeOptions } from "@aztec-labs/aztec.js/contracts";
import type { Wallet } from "@aztec-labs/aztec.js/wallet";
import { sutils } from "@nemi-fi/utils";

export async function executeSwapApiQuote(
  wallet: Wallet,
  taker: AztecAddress,
  quote: SwapApiQuote,
  /**
   * Passed through to the transaction. Without a fee payment method the taker pays its own
   * fees, which fails for an account that holds no fee juice.
   */
  options: { fee?: InteractionFeeOptions } = {},
) {
  const { ExecutionPayload, mergeExecutionPayloads } =
    await import("@aztec-labs/stdlib/tx");
  const { NO_WAIT } = await import("@aztec-labs/aztec.js/contracts");

  const q = await decodeSwapApiQuote(quote);
  let executionPayload = new ExecutionPayload(
    q.calls,
    await Promise.all(
      q.allowanceIntents.map((intent) => wallet.createAuthWit(taker, intent)),
    ),
    [], // capsules
  );

  // `wallet.sendTx` takes the fee payer from `executionPayload.feePayer` and ignores
  // `fee.paymentMethod` (unlike `interaction.send`), so merge the payment method's own
  // execution payload in ourselves. This carries the sponsored FPC as fee payer; without it
  // the taker pays its own fees and any account with no fee juice fails with "Not enough
  // balance for fee payer". The fee payload must come first so the account entrypoint splits
  // phases correctly (fee setup, then the swap calls), matching what aztec.js
  // `ContractFunctionInteraction.request` does internally.
  if (options.fee?.paymentMethod) {
    const feePayload = await options.fee.paymentMethod.getExecutionPayload();
    executionPayload = mergeExecutionPayloads([feePayload, executionPayload]);
  }

  const { txHash } = await wallet.sendTx(executionPayload, {
    from: taker,
    fee: options.fee,
    wait: NO_WAIT,
  });
  return txHash;
}

export async function decodeSwapApiQuote(
  quote: SwapApiQuote,
): Promise<ExecuteInfo> {
  const calls = await Promise.all(
    quote.transaction.calls.map((call) => decodeFunctionCall(call)),
  );
  const allowanceIntents = await Promise.all(
    quote.transaction.allowanceIntents.map(async (intent) => ({
      // the quote comes from the swap API, so the address is untrusted and has to be
      // checked rather than just parsed
      caller: await sutils.resolveAztecAddress(intent.caller),
      call: await decodeFunctionCall(intent.call),
    })),
  );
  return {
    calls,
    allowanceIntents,
  };
}

export interface SwapApiQuote {
  transaction: {
    calls: SerializedFunctionCall[];
    allowanceIntents: {
      /** `AztecAddress` */
      caller: string;
      call: SerializedFunctionCall;
    }[];
  };
  sellToken: string;
  sellAmount: string;
  buyToken: string;
  buyAmount: string;
}

export function mergeExecuteInfos(executeInfos: ExecuteInfo[]): ExecuteInfo {
  return {
    calls: executeInfos.flatMap((e) => e.calls),
    allowanceIntents: executeInfos.flatMap((e) => e.allowanceIntents),
  };
}

export interface ExecuteInfo {
  readonly calls: FunctionCall[];
  /** empty if no account address is provided */
  readonly allowanceIntents: CallIntent[];
}

export async function encodeFunctionCall(call: FunctionCall) {
  const { jsonStringify } = await import("@aztec-labs/foundation/json-rpc");
  return jsonStringify(call) as SerializedFunctionCall;
}

export async function decodeFunctionCall(fc: string) {
  const { FunctionCall } = await import("@aztec-labs/aztec.js/abi");
  return FunctionCall.schema.parse(JSON.parse(fc));
}

type SerializedFunctionCall = string & { __brand: "SerializedFunctionCall" };
