import { sutils } from "@nemi-fi/utils";
import { z } from "zod";
import type {
  CoreService,
  CurrencyListService,
  IQuote,
  IQuoter,
} from "../../sdk.js";
import {
  encodeFunctionCall,
  type SwapApiQuote,
} from "../swap-api-helpers-for-public.js";

export class SwapApiService {
  constructor(
    private core: CoreService,
    private currencyList: CurrencyListService,
    private quoter: IQuoter,
  ) {}

  async getApiQuote(input: SwapApiInputSchema): Promise<SwapApiQuote> {
    if (input.chainId !== this.core.chain.id) {
      // TODO: support multi-chain
      throw new Error(
        `Chain ID mismatch: ${input.chainId} !== ${this.core.chain.id}`,
      );
    }

    const taker = input.taker
      ? await sutils.resolveAztecAddress(input.taker)
      : undefined;
    const currencyIn = await this.currencyList.getCurrencyByAddressOrThrow(
      input.sellToken,
    );
    const currencyOut = await this.currencyList.getCurrencyByAddressOrThrow(
      input.buyToken,
    );
    const amountIn = sutils.bigIntToCurrencyAmount(
      currencyIn,
      input.sellAmount,
    );
    const quote = await this.quoter.getQuote({
      account: taker,
      amountIn,
      currencyOut,
    });
    if (!quote) {
      throw new Error("no quote found");
    }

    return encodeSwapApiQuote(quote);
  }
}

export type SwapApiInputSchema = z.infer<typeof SwapApiInputSchema>;
export const SwapApiInputSchema = z.object({
  chainId: z.coerce.number().pipe(sutils.SupportedAvmChainIdSchema),
  taker: sutils.zAztecAddress().optional(),
  sellToken: sutils.zAztecAddress(),
  buyToken: sutils.zAztecAddress(),
  sellAmount: sutils.zStringBigInt(),
});

export async function encodeSwapApiQuote(quote: IQuote) {
  const calls = await Promise.all(
    quote.executeInfo.calls.map((call) => encodeFunctionCall(call)),
  );
  const apiQuote: SwapApiQuote = {
    transaction: {
      calls,
      allowanceIntents: await Promise.all(
        quote.executeInfo.allowanceIntents.map(async (intent) => ({
          caller: intent.caller.toString(),
          call: await encodeFunctionCall(intent.call),
        })),
      ),
    },
    sellToken: quote.amountIn.currency.address,
    sellAmount: sutils.currencyAmountToBigInt(quote.amountIn).toString(),
    buyToken: quote.amountOut.currency.address,
    buyAmount: sutils.currencyAmountToBigInt(quote.amountOut).toString(),
  };
  return apiQuote;
}
