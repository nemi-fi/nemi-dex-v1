import type { AztecAddress } from "@aztec/aztec.js/addresses";
import type { Aliased } from "@aztec/aztec.js/wallet";
import type { EmbeddedWallet } from "@aztec/wallets/embedded";
import { sutils } from "@nemi-fi/utils";
import type { CoreService } from "../sdk.js";
import { getSingleKeyAccount } from "../utils.js";
import type { Account } from "./WalletService.js";

/** An embedded account plus its display name, for the connect UI. */
export type NamedAccount = Account & { name: string };

/**
 * The embedded ("local") wallet, backed by {@link https://www.npmjs.com/package/@aztec/wallets | EmbeddedWallet}.
 *
 * Replaces the previous passkey/webauthn wallet: accounts are created and persisted by the
 * EmbeddedWallet itself (IndexedDB in the browser), so nothing secret is stored by this app.
 * On reload {@link https://www.npmjs.com/package/@aztec/wallets | EmbeddedWallet.getAccounts}
 * lists the persisted accounts and the wallet can sign for them directly.
 */
export class EmbeddedWalletService {
  // The EmbeddedWallet is the source of truth for the accounts (it persists them in IndexedDB,
  // along with their aliases). We only cache its `getAccounts()` result so the UI has a
  // synchronous, reactive view; the list is never mutated by hand, so it cannot drift.
  readonly #accounts = sutils.svelte.state<Aliased<AztecAddress>[]>([]);
  #wallet: EmbeddedWallet | undefined;
  // Only the selected address is persisted by us, and it is public information.
  readonly #selectedAddress: { current: string | null };
  readonly ready: Promise<unknown>;

  constructor(
    localStorageKey: string,
    private core: CoreService,
  ) {
    this.#selectedAddress = sutils.svelte.persistedState(
      `${localStorageKey}-selected-v3`,
      null,
    );
    this.ready = this.#refresh();
  }

  get allAccounts(): NamedAccount[] {
    const wallet = this.#wallet;
    if (!wallet) {
      return [];
    }
    return this.#accounts.current.map(({ alias, item }) => ({
      wallet,
      address: item,
      name: alias || sutils.shortenAddress(item),
    }));
  }

  get selectedAccount(): Account | undefined {
    const selectedAddr = this.#selectedAddress.current;
    if (!selectedAddr) {
      return undefined;
    }
    return this.allAccounts.find((a) =>
      sutils.isAddressEqual(a.address, selectedAddr),
    );
  }

  async selectAccount(address: sutils.AztecAddressable) {
    const resolved = await sutils.resolveAztecAddress(address);
    this.#selectedAddress.current = resolved.toString();
  }

  async deselectAccount() {
    this.#selectedAddress.current = null;
  }

  /**
   * Reloads the account list from the EmbeddedWallet. Used on startup (to restore accounts
   * persisted in a previous session) and after creating one, so there is a single code path
   * that populates the list and it always matches what the wallet actually holds.
   */
  async #refresh(): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }
    const wallet = (this.#wallet ??= await this.core.getTestWallet());
    this.#accounts.current = await wallet.getAccounts();
    if (!this.#selectedAddress.current && this.#accounts.current[0]) {
      await this.selectAccount(this.#accounts.current[0].item);
    }
  }

  /**
   * Creates a brand-new account. The EmbeddedWallet stores its secret; the account is
   * initializerless (no deployment tx) and its fees are paid by the sponsored FPC, so it can
   * transact immediately without the user holding any funds.
   */
  async createAccount(name?: string): Promise<Account> {
    const { Fr } = await import("@aztec/aztec.js/fields");
    const wallet = (this.#wallet ??= await this.core.getTestWallet());

    const secretKey = Fr.random();
    const manager = await getSingleKeyAccount(
      wallet,
      secretKey,
      name ?? defaultAccountName(),
    );
    const account = await this.core.ensureAccountDeployed(manager);

    await this.#refresh();
    await this.selectAccount(account.address);
    return account;
  }
}

function defaultAccountName() {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `Account ${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
