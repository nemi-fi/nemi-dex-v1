import type { ContractFunctionInteraction } from "@aztec-labs/aztec.js/contracts";
import type { Fr } from "@aztec-labs/aztec.js/fields";
import { tokenContract } from "@nemi-fi/contracts";
import { sutils } from "@nemi-fi/utils";
import { L2Token } from "@nemi-fi/v1-sdk";
import { CurrencyAmount } from "@uniswap/sdk-core";
import { assert, UnreachableCaseError } from "ts-essentials";
import type {
  Account,
  CoreService,
  TransactionTrackerService,
} from "../sdk.js";

export class CurrencyService {
  constructor(
    private core: CoreService,
    private transactionTracker: TransactionTrackerService,
  ) {}

  async balanceOfPrivate(token: L2Token, account: Account) {
    const contract = await tokenContract(
      token,
      account,
      await this.core.aztecNode(),
    );
    const { result: rawAmount } = await contract.methods
      .balance_of_private(await sutils.resolveAztecAddress(account))
      .simulate({ from: account.address });
    const typed = rawAmount as bigint;
    return sutils.bigIntToCurrencyAmount(token, typed);
  }

  async balanceOfPublic(token: L2Token, address: sutils.AztecAddressable) {
    const contract = await tokenContract(
      token,
      await this.core.getReadonlyAccount(),
      await this.core.aztecNode(),
    );
    address = await sutils.resolveAztecAddress(address);
    const { result: rawAmount } = await contract.methods
      .balance_of_public(address)
      .simulate({ from: address });
    return sutils.bigIntToCurrencyAmount(token, rawAmount as bigint);
  }

  async totalSupply(token: L2Token) {
    const randomAcc = await this.core.getReadonlyAccount();
    const { result: rawAmount } = await (
      await tokenContract(token, randomAcc, await this.core.aztecNode())
    ).methods
      .total_supply()
      .simulate({ from: randomAcc.address });
    return sutils.bigIntToCurrencyAmount(token, rawAmount as bigint);
  }

  async mintPrivate({
    to,
    amount,
  }: {
    to: Account;
    amount: CurrencyAmount<L2Token>;
  }) {
    // TODO(security): make minter secret
    const minter = await this.core.getReadonlyAccount();
    const contract = await tokenContract(
      amount.currency,
      minter,
      await this.core.aztecNode(),
    );

    const aztecNode = await this.core.aztecNode();
    return await sutils.bench("mintPrivate", aztecNode, async () =>
      this.transactionTracker.track(
        minter,
        contract.methods.mint_to_private(
          await sutils.resolveAztecAddress(to),
          sutils.currencyAmountToBigInt(amount),
        ),
        `mint ${sutils.displayCurrencyAmount(amount)}`,
      ),
    );
  }

  async transferPrivate(params: TransferPrivateParams) {
    const toAddress = await sutils.resolveAztecAddress(params.to);
    const contract = await tokenContract(
      params.amount.currency,
      params.account,
      await this.core.aztecNode(),
    );
    return await this.transactionTracker.track(
      params.account,
      contract.methods.transfer_private_to_private(
        await sutils.resolveAztecAddress(params.account),
        toAddress,
        sutils.currencyAmountToBigInt(params.amount),
        0, // nonce, must be 0 if transferring from own account
      ),
      `send privately ${sutils.displayCurrencyAmount(params.amount)} to ${sutils.shortenAddress(toAddress)}`,
    );
  }

  async transferPublic(params: {
    account: Account;
    to: sutils.AztecAddressable;
    amount: CurrencyAmount<L2Token>;
  }) {
    const contract = await tokenContract(
      params.amount.currency,
      params.account,
      await this.core.aztecNode(),
    );
    const toAddress = await sutils.resolveAztecAddress(params.to);
    return await this.transactionTracker.track(
      params.account,
      contract.methods.transfer_public_to_public(
        await sutils.resolveAztecAddress(params.account),
        toAddress,
        sutils.currencyAmountToBigInt(params.amount),
        0, // nonce, must be 0 if transferring from own account
      ),
      `send publicly ${sutils.displayCurrencyAmount(params.amount)} to ${sutils.shortenAddress(toAddress)}`,
    );
  }

  async transferToPublic({
    account,
    to,
    amount,
  }: {
    account: Account;
    to: sutils.AztecAddressable;
    amount: CurrencyAmount<L2Token>;
  }) {
    const contract = await tokenContract(
      amount.currency,
      account,
      await this.core.aztecNode(),
    );
    const toAddress = await sutils.resolveAztecAddress(to);
    return await this.transactionTracker.track(
      account,
      contract.methods.transfer_private_to_public(
        await sutils.resolveAztecAddress(account),
        toAddress,
        sutils.currencyAmountToBigInt(amount),
        0, // nonce, must be 0 if transferring from own account
      ),
      `send from private to public ${sutils.displayCurrencyAmount(amount)} to ${sutils.shortenAddress(toAddress)}`,
    );
  }

  async transferToPrivate({
    account,
    to,
    amount,
  }: {
    account: Account;
    to: sutils.AztecAddressable;
    amount: CurrencyAmount<L2Token>;
  }) {
    const contract = await tokenContract(
      amount.currency,
      account,
      await this.core.aztecNode(),
    );
    const toAddress = await sutils.resolveAztecAddress(to);
    return await this.transactionTracker.track(
      account,
      contract.methods.transfer_public_to_private(
        await sutils.resolveAztecAddress(account),
        toAddress,
        sutils.currencyAmountToBigInt(amount),
        0, // nonce, must be 0 if transferring from own account
      ),
      `send from public to private ${sutils.displayCurrencyAmount(amount)} to ${sutils.shortenAddress(toAddress)}`,
    );
  }

  async createTransferAuthWitness(
    request: {
      owner: sutils.AztecAddressable;
      spender: sutils.AztecAddressable;
      amount: CurrencyAmount<L2Token>;
      nonce: Fr;
    } & (
      | {
          method:
            | "transfer_private_to_public"
            | "transfer_private_to_public_with_commitment";
          to: sutils.AztecAddressable;
        }
      | {
          method: "transfer_private_to_commitment";
          partialNote: CurrencyAmountPartialNote;
        }
    ),
  ) {
    const owner = await sutils.resolveAztecAddress(request.owner);
    const token = await tokenContract(
      request.amount.currency,
      await this.core.getReadonlyAccount(),
      await this.core.aztecNode(),
    );
    const amount = sutils.currencyAmountToBigInt(request.amount);
    const nonce = request.nonce;
    let action: ContractFunctionInteraction;
    switch (request.method) {
      case "transfer_private_to_public":
      case "transfer_private_to_public_with_commitment": {
        action = token.methods[request.method](
          owner,
          await sutils.resolveAztecAddress(request.to),
          amount,
          nonce,
        );
        break;
      }
      case "transfer_private_to_commitment": {
        action = token.methods.transfer_private_to_commitment(
          owner,
          request.partialNote.commitment,
          amount,
          nonce,
        );
        break;
      }
      default: {
        throw new UnreachableCaseError(request);
      }
    }
    const calls = (await action.request()).calls;
    assert(
      calls.length === 1,
      `expected exactly 1 call for ${request.method} auth witness`,
    );
    const call = calls[0]!;
    return {
      caller: await sutils.resolveAztecAddress(request.spender),
      call,
    };
  }
}

export type TransferPrivateParams = {
  account: Account;
  to: sutils.AztecAddressable;
  amount: CurrencyAmount<L2Token>;
};

export class CurrencyAmountPartialNote {
  constructor(readonly commitment: Fr) {}
}
