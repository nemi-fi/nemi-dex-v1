import type { AztecAddress } from "@aztec-labs/aztec.js/addresses";
import type { Wallet } from "@aztec-labs/aztec.js/wallet";
import type { WalletProvider } from "@aztec-labs/wallet-sdk/manager";
import { sutils } from "@nemi-fi/utils";
import { assert, UnreachableCaseError, type ValueOf } from "ts-essentials";
import type { CoreService } from "../sdk.js";
import type { IToastService } from "../types.js";
import type { CapabilitiesService } from "./CapabilitiesService.js";
import type { EmbeddedWalletService } from "./EmbeddedWalletService.js";

/**
 * An established external-wallet connection. All of its parts live and die together, so they are
 * kept in a single object: a non-null value means "connected", `null` means "not connected".
 */
interface ExternalConnection {
  readonly provider: WalletProvider;
  readonly wallet: Wallet;
  readonly address: AztecAddress;
  readonly unsubscribe: () => void;
}

/** Matches the wallet-sdk default: a 3x3 grid, 72 bits of security. */
const VERIFICATION_EMOJI_COUNT = 9;

/** How long to wait for the user to approve the discovery request in their wallet. */
const WALLET_DISCOVERY_TIMEOUT_MS = 60_000;

export class WalletService {
  readonly #isConnecting = sutils.svelte.state(false);
  readonly #connection = sutils.svelte.state<ExternalConnection | null>(null);
  // Transient: shown during the verify phase, before the connection is confirmed, so it cannot
  // live inside `#connection`.
  readonly #verificationEmojis = sutils.svelte.state<string[] | null>(null);
  #resolveVerification: ((confirmed: boolean) => void) | null = null;

  constructor(
    private core: CoreService,
    private embeddedWallet: EmbeddedWalletService,
    private capabilities: CapabilitiesService,
    private toast: IToastService,
  ) {}

  /**
   * Resolves once a persisted embedded session has been restored (immediately when there is
   * none, since the embedded wallet then starts lazily).
   */
  get ready() {
    return this.embeddedWallet.ready;
  }

  /** @deprecated use {@link sutils.assertConnected} */
  assertConnected() {
    const account = this.selectedAccount;
    assert(account, "Wallet not connected");
    return account;
  }

  get isEmbeddedWalletSupported() {
    return sutils.isTestnet(this.core.chain.id);
  }

  get selectedAccount() {
    if (this.type === WalletType.local) {
      return this.embeddedWallet.selectedAccount;
    } else if (this.type === WalletType.external) {
      const conn = this.#connection.current;
      if (!conn) {
        return undefined;
      }
      // External wallets sign for their own addresses; `{ wallet, address }` is enough.
      return { wallet: conn.wallet, address: conn.address };
    } else {
      throw new UnreachableCaseError(this.type);
    }
  }

  /**
   * Embedded accounts available to select, each with a display name for the connect UI.
   * Empty until {@link loadAccounts} has run (or a session was restored at startup).
   */
  get accounts() {
    if (!this.isEmbeddedWalletSupported) {
      return [];
    }
    return this.embeddedWallet.allAccounts;
  }

  /** Starts the embedded wallet if needed so {@link accounts} is populated. */
  async loadAccounts() {
    await this.embeddedWallet.load();
  }

  async selectAccount(address: sutils.AztecAddressable) {
    await this.embeddedWallet.selectAccount(address);
  }

  readonly #type = sutils.iife(() => {
    const type = sutils.svelte.persistedState<WalletType>(
      "wallet-type-v4",
      WalletType.local,
    );

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      for (const typ of Object.values(WalletType)) {
        if (url.searchParams.get(typ) === "1") {
          type.current = typ; // trigger localStorage update
          break;
        }
      }
    }

    return type;
  });

  get type() {
    if (!this.isEmbeddedWalletSupported) {
      return WalletType.external;
    }
    return this.#type.current;
  }

  get isConnecting() {
    return this.#isConnecting.current;
  }

  /**
   * Emoji fingerprint of the external wallet channel awaiting verification, or `null` when nothing
   * is awaiting verification. The user should check it matches what their wallet displays, then
   * call {@link confirmVerification} or {@link rejectVerification}.
   */
  get verificationEmojis() {
    return this.#verificationEmojis.current;
  }

  /** The user confirmed the emojis match their wallet: finish connecting. */
  confirmVerification() {
    this.#resolveVerification?.(true);
  }

  /** The user says the emojis don't match (or gave up): abort the pending connection. */
  rejectVerification() {
    this.#resolveVerification?.(false);
  }

  /**
   * Discover available external wallet extensions via the Aztec wallet-sdk.
   *
   * A wallet only reveals itself after the user approves the discovery request in it, which can
   * take a while. So wallets are streamed via `onWalletDiscovered` as they are approved, and the
   * returned promise resolves once discovery times out or `signal` is aborted.
   */
  async discoverWallets({
    onWalletDiscovered,
    signal,
  }: {
    onWalletDiscovered: (wallet: DiscoveredWallet) => void;
    signal?: AbortSignal;
  }): Promise<void> {
    try {
      const { WalletManager } = await import("@aztec-labs/wallet-sdk/manager");
      const wallet = await this.core.getTestWallet();
      const chainInfo = await wallet.getChainInfo();
      if (signal?.aborted) {
        return;
      }

      const manager = WalletManager.configure({
        extensions: { enabled: true },
      });
      const discovery = manager.getAvailableWallets({
        appId: this.#getAppId(),
        chainInfo,
        timeout: WALLET_DISCOVERY_TIMEOUT_MS,
        onWalletDiscovered: (provider) => onWalletDiscovered({ provider }),
      });
      signal?.addEventListener("abort", () => discovery.cancel(), {
        once: true,
      });
      await discovery.done;
    } catch (error) {
      this.toast.error(
        "Failed to discover wallets: " + sutils.errorToString(error),
      );
    }
  }

  /** Connect to an external wallet provider discovered via {@link discoverWallets}. */
  async connectToExternalWallet(provider: WalletProvider): Promise<void> {
    this.#isConnecting.current = true;
    try {
      await this.#clearConnection(true);

      const pending = await provider.establishSecureChannel(this.#getAppId());

      // Show the emoji fingerprint and wait for the user to verify it matches their wallet. If we
      // can't produce it the user can't verify the channel, so fail instead of connecting blind.
      const { hashToEmoji } = await import("@aztec-labs/wallet-sdk/crypto");
      // One emoji per hash byte, the same sequence `hashToEmoji(hash)` yields, but kept as
      // separate items so the UI can lay them out as a grid.
      const emojis = Array.from({ length: VERIFICATION_EMOJI_COUNT }, (_, i) =>
        hashToEmoji(pending.verificationHash.slice(i * 2, i * 2 + 2), 1),
      );
      const confirmed = await new Promise<boolean>((resolve) => {
        this.#resolveVerification = resolve;
        this.#verificationEmojis.current = emojis;
      });
      this.#resolveVerification = null;
      this.#verificationEmojis.current = null;
      if (!confirmed) {
        pending.cancel();
        throw new Error("Connection cancelled: the emojis were not confirmed");
      }

      const wallet = await pending.confirm();

      const response = await wallet.requestCapabilities(
        await this.capabilities.getAppCapabilities(),
      );
      const granted = response.granted.find((cap) => cap.type === "accounts");
      assert(
        granted,
        "The wallet did not grant access to any account. Approve the connection request to continue.",
      );
      const address = granted.accounts[0]?.item;
      assert(address, "The wallet granted access but selected no account.");

      this.#connection.current = {
        provider,
        wallet,
        address,
        unsubscribe: provider.onDisconnect(() =>
          this.#handleUnexpectedDisconnect(),
        ),
      };
      this.#type.current = WalletType.external;

      this.toast.success("External wallet connected");
    } catch (error) {
      this.toast.error(
        `Error connecting to external wallet: ${sutils.errorToString(error)}`,
      );
      throw error;
    } finally {
      this.#isConnecting.current = false;
    }
  }

  async connect(params: ConnectParams) {
    this.#isConnecting.current = true;
    try {
      switch (params.type) {
        case WalletType.local: {
          assert(
            this.isEmbeddedWalletSupported,
            `The embedded wallet is not available on ${this.core.chain.name}`,
          );
          this.#type.current = WalletType.local;
          await this.embeddedWallet.createAccount(params.name);
          break;
        }
        case WalletType.external: {
          await this.connectToExternalWallet(params.provider);
          break;
        }
        default: {
          throw new UnreachableCaseError(params);
        }
      }
    } catch (error) {
      this.toast.error(
        `Error connecting wallet: ${sutils.errorToString(error)}`,
      );
      throw error;
    } finally {
      this.#isConnecting.current = false;
    }
  }

  /**
   * Tears down the current external connection, if any. Pass `disconnectProvider: true` to also
   * ask the provider to disconnect (skip it when the provider already went away on its own).
   */
  async #clearConnection(disconnectProvider: boolean) {
    this.rejectVerification();
    const conn = this.#connection.current;
    this.#connection.current = null;
    if (!conn) {
      return;
    }
    conn.unsubscribe();
    if (disconnectProvider) {
      try {
        await conn.provider.disconnect();
      } catch (error) {
        this.toast.error(
          `Error disconnecting wallet: ${sutils.errorToString(error)}`,
        );
      }
    }
  }

  #handleUnexpectedDisconnect() {
    void this.#clearConnection(false);
    this.toast.log("Wallet disconnected.");
  }

  async disconnect() {
    if (this.type === WalletType.external) {
      await this.#clearConnection(true);
    } else {
      await this.embeddedWallet.deselectAccount();
    }
  }

  #getAppId() {
    return window.origin;
  }
}

export type Account = sutils.WalletAccount;

export type WalletType = ValueOf<typeof WalletType>;
export const WalletType = {
  external: "external",
  local: "local",
} as const;

export interface DiscoveredWallet {
  provider: WalletProvider;
}

export type ConnectParams =
  | {
      type: (typeof WalletType)["local"];
      /** Optional display name for the new embedded account. */
      name?: string;
    }
  | {
      type: (typeof WalletType)["external"];
      provider: WalletProvider;
    };
