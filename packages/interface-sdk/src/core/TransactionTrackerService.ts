import type { ContractFunctionInteraction } from "@aztec/aztec.js/contracts";
import type { TxHash } from "@aztec/aztec.js/tx";
import { sutils } from "@nemi-fi/utils";
import { z } from "zod";
import type { CoreService, LoggerService } from "../sdk.js";
import type { IToastService } from "../types.js";

class TransactionTrackerServiceBase {
  constructor(
    private core: CoreService,
    private toast: IToastService,
    private logger: LoggerService,
  ) {}

  #invalidations: (() => void)[] = [];

  async #sendTx(
    txRequest: BaseFunctionInteraction,
    from: sutils.WalletAccount,
  ) {
    const { NO_WAIT } = await import("@aztec/aztec.js/contracts");
    const { txHash } = await txRequest.send({
      from: from.address,
      fee: {
        // Sponsor only embedded-wallet transactions; external wallets pay their own fees.
        paymentMethod: await this.core.getSponsoredFeePaymentMethodFor(
          from.wallet,
        ),
      },
      wait: NO_WAIT,
    });
    return txHash;
  }

  async track(
    from: sutils.WalletAccount,
    txReq: BaseFunctionInteraction | TxHash,
    message: string,
  ) {
    const toastId = crypto.randomUUID();
    const promise = sutils.iife(async () => {
      const { TxHash } = await import("@aztec/aztec.js/tx");
      const { waitForTx } = await import("@aztec/aztec.js/node");
      let txHash: TxHash;
      if (!(txReq instanceof TxHash)) {
        txHash = await this.#sendTx(txReq, from);
      } else {
        txHash = txReq;
      }

      const sentTx: sutils.TxLike = {
        hash: txHash,
        wait: async () => {
          const waitPromise = waitForTx(await this.core.aztecNode(), txHash, {
            timeout: sutils.AZTEC_TX_WAIT_TIMEOUT,
          });
          await this.toast.promise(
            waitPromise,
            {
              loading: `Confirming on-chain "${message}"...`,
              success: `Tx "${message}" confirmed!`,
              error: (e) => `Tx "${message}" failed: ${e}`,
            },
            {
              id: toastId,
            },
          );
          const receipt = await waitPromise;
          this.#invalidateAll();
          return receipt;
        },
      };
      return sentTx;
    });

    return this.toast.promise(
      promise,
      {
        loading: `Creating a ZK proof for "${message}"...`,
        success: `Tx "${message}" sent!`,
        error: (e) => `Creating a ZK proof for "${message}" failed: ${e}`,
      },
      {
        id: toastId,
      },
    );
  }

  addInvalidation(fn: () => void) {
    this.#invalidations.push(fn);
    return () => {
      this.#invalidations = this.#invalidations.filter((f) => f !== fn);
    };
  }

  #invalidateAll() {
    for (const fn of this.#invalidations) {
      try {
        fn();
      } catch (e) {
        this.logger.error(e);
      }
    }
  }
}

export type StoredTxSchema = z.infer<typeof StoredTxSchema>;
export const StoredTxSchema = z.object({
  hash: z.string(),
  description: z.string(),
});

export class TransactionTrackerService extends TransactionTrackerServiceBase {
  #txs = sutils.svelte.persistedState<Record<string, StoredTxSchema[]>>(
    "transaction-tracker-txs-v1",
    {},
  );

  async trackWithAccount(
    account: sutils.WalletAccount,
    txReq: BaseFunctionInteraction | TxHash,
    message: string,
  ) {
    const tx = await super.track(account, txReq, message);
    const key = (await sutils.resolveAztecAddress(account))
      .toString()
      .toLowerCase();

    this.#txs.current = {
      ...this.#txs.current,
      [key]: [
        ...(this.#txs.current[key] ?? []),
        {
          hash: tx.hash.toString(),
          description: message,
        },
      ],
    };
    return tx;
  }

  async getTxs(account: sutils.AztecAddressable) {
    const key = (await sutils.resolveAztecAddress(account))
      .toString()
      .toLowerCase();
    return this.#txs.current[key] ?? [];
  }
}

// TODO: import from `@aztec/aztec.js` when it is exported
type BaseFunctionInteraction = Pick<ContractFunctionInteraction, "send">;
