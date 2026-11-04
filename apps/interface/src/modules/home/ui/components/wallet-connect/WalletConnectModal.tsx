import { Spinner } from "#/components/ui/spinner.js";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "#/components/ui/responsive-modal.js";
import { useIsMobile } from "#/hooks/use-mobile.js";
import { useSvelte } from "#/hooks/use-svelte.js";
import { lib } from "#/lib/sdk.js";
import { cn } from "#/lib/utils.js";
import { interfaceSdk } from "@nemi-fi/interface-sdk";
import { sutils } from "@nemi-fi/utils";
import {
  ArrowClockwiseIcon,
  ArrowSquareOutIcon,
  CaretDownIcon,
  PlusIcon,
  WalletIcon,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";

type ConnectParams = interfaceSdk.ConnectParams;
type DiscoveredWallet = interfaceSdk.DiscoveredWallet;

const WALLET_INSTALL_URL = "https://nulo.sh";

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletConnectModal = ({
  isOpen,
  onClose,
}: WalletConnectModalProps) => {
  const [isOtherWalletsExpanded, setShowOtherWallets] = useState(false);
  const isMobile = useIsMobile();

  const isConnecting = useSvelte(() => lib.wallet.isConnecting);
  const verificationEmojis = useSvelte(() => lib.wallet.verificationEmojis);
  const accounts = useSvelte(() => lib.wallet.accounts);
  const isEmbeddedWalletSupported = useSvelte(
    () => lib.wallet.isEmbeddedWalletSupported,
  );
  const showOtherWallets = isOtherWalletsExpanded || !isEmbeddedWalletSupported;

  // The embedded wallet starts lazily (it boots a PXE); load its accounts once the modal opens.
  useEffect(() => {
    if (isOpen) {
      lib.wallet.loadAccounts().catch((error) => {
        console.error("Failed to load embedded accounts:", error);
      });
    }
  }, [isOpen]);

  // Discover external wallets once "Other Wallets" is expanded. A wallet only reveals itself after
  // the user approves the discovery request in it, so wallets are shown as they arrive and we keep
  // waiting (instead of claiming none were found) until discovery times out.
  const [externalWallets, setExternalWallets] = useState<DiscoveredWallet[]>(
    [],
  );
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryAttempt, setDiscoveryAttempt] = useState(0);
  useEffect(() => {
    if (!isOpen || !showOtherWallets) {
      return;
    }
    const controller = new AbortController();
    setExternalWallets([]);
    setIsDiscovering(true);
    lib.wallet
      .discoverWallets({
        signal: controller.signal,
        onWalletDiscovered: (wallet) => {
          if (controller.signal.aborted) {
            return;
          }
          setExternalWallets((prev) =>
            prev.some((w) => w.provider.id === wallet.provider.id)
              ? prev
              : [...prev, wallet],
          );
        },
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsDiscovering(false);
        }
      });
    return () => controller.abort();
  }, [isOpen, showOtherWallets, discoveryAttempt]);

  // `connect`/`selectAccount` surface their own errors via toast and rethrow, so we don't catch
  // (and swallow) here — we just close the modal once they succeed.
  const handleConnect = async (params: ConnectParams) => {
    await lib.wallet.connect(params);
    onClose();
  };

  const handleSelect = async (address: sutils.AztecAddressable) => {
    await lib.wallet.selectAccount(address);
    onClose();
  };

  // Closing the modal mid-verification must not leave the connection hanging.
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      lib.wallet.rejectVerification();
      onClose();
    }
  };

  const EmojiVerification = ({ emojis }: { emojis: string[] }) => (
    <div className="flex flex-col items-center">
      <p className="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
        Check that these emojis match the ones shown in your wallet, in the same
        order.
      </p>
      <div
        className="mb-6 grid grid-cols-3 gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20"
        aria-label={`Verification emojis: ${emojis.join(" ")}`}
      >
        {emojis.map((emoji, idx) => (
          <span
            key={idx}
            className="flex h-14 w-14 items-center justify-center rounded-md bg-white text-3xl leading-none dark:bg-gray-800"
            aria-hidden="true"
          >
            {emoji}
          </span>
        ))}
      </div>
      <div className="flex w-full flex-col gap-2">
        <button
          className="w-full rounded-lg bg-blue-600 p-3 font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          onClick={() => lib.wallet.confirmVerification()}
        >
          They match
        </button>
        <button
          className="w-full rounded-lg border border-gray-200 p-3 font-medium transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
          onClick={() => lib.wallet.rejectVerification()}
        >
          They don't match
        </button>
      </div>
    </div>
  );

  const WalletOptions = () => (
    <>
      {/* Primary Option - Embedded wallet */}
      <div className="mb-6" hidden={!isEmbeddedWalletSupported}>
        {accounts.length > 0 && (
          <div className="mb-3 space-y-2">
            {accounts.map((acc) => (
              <button
                key={acc.address.toString()}
                className={cn(
                  "w-full p-3 flex items-center gap-3 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors text-left",
                  isConnecting
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:border-blue-500 dark:hover:border-blue-400",
                )}
                disabled={isConnecting}
                onClick={() => !isConnecting && handleSelect(acc.address)}
                aria-label={`Use account ${acc.name}`}
              >
                <WalletIcon
                  className="h-5 w-5 text-blue-600"
                  aria-hidden="true"
                />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">
                    {acc.name}
                  </span>
                  <span className="block text-xs text-gray-500 font-mono">
                    {sutils.shortenAddress(acc.address)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

        <button
          className={cn(
            "w-full p-4 flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm",
            isConnecting && "opacity-80 cursor-not-allowed",
          )}
          disabled={isConnecting}
          onClick={() => handleConnect({ type: interfaceSdk.WalletType.local })}
        >
          {isConnecting ? (
            <Spinner className="h-5 w-5 text-white" />
          ) : (
            <PlusIcon className="h-5 w-5" aria-hidden="true" />
          )}
          <span className="text-base">
            {isConnecting
              ? "Creating..."
              : accounts.length > 0
                ? "Create new account"
                : "Create Account"}
          </span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative mb-6" hidden={!isEmbeddedWalletSupported}>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-2 bg-white dark:bg-gray-800 text-sm text-gray-500">
            or
          </span>
        </div>
      </div>

      {/* Secondary Option - External wallets */}
      <div>
        <button
          hidden={!isEmbeddedWalletSupported}
          className={cn(
            "w-full text-left font-medium flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors",
            showOtherWallets ? "bg-gray-50 dark:bg-gray-700/50" : "",
          )}
          onClick={() => setShowOtherWallets(!showOtherWallets)}
        >
          <span>Connect with Other Wallets</span>
          <CaretDownIcon
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              showOtherWallets ? "rotate-180" : "",
            )}
            aria-hidden="true"
          />
        </button>

        {showOtherWallets && (
          <div className="overflow-hidden transition-all duration-300">
            {externalWallets.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                {externalWallets.map((wallet) => (
                  <button
                    key={wallet.provider.id}
                    className={cn(
                      "p-4 flex flex-col items-center justify-center border border-gray-200 dark:border-gray-700 rounded-lg transition-all",
                      isConnecting && "opacity-60 cursor-not-allowed",
                      "hover:border-blue-500 dark:hover:border-blue-400",
                    )}
                    disabled={isConnecting}
                    onClick={() =>
                      !isConnecting &&
                      handleConnect({
                        type: interfaceSdk.WalletType.external,
                        provider: wallet.provider,
                      })
                    }
                    aria-label={`Connect with ${wallet.provider.name}`}
                  >
                    {wallet.provider.icon ? (
                      <img
                        src={wallet.provider.icon}
                        alt=""
                        className="w-8 h-8 mb-2"
                      />
                    ) : (
                      <WalletIcon
                        className="w-8 h-8 mb-2 text-gray-400"
                        aria-hidden="true"
                      />
                    )}
                    <span className="text-sm font-medium">
                      {wallet.provider.name}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {isDiscovering ? (
              <div className="flex flex-col items-center p-4 text-center">
                <div className="flex items-center">
                  <Spinner className="h-5 w-5" />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    {externalWallets.length > 0
                      ? "Looking for more wallets..."
                      : "Looking for wallets..."}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Approve the connection request in your wallet to show it here.
                </p>
              </div>
            ) : (
              externalWallets.length === 0 && (
                <div className="flex flex-col items-center p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  <p>No external wallets found.</p>
                  <button
                    className="mt-2 inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
                    onClick={() => setDiscoveryAttempt((n) => n + 1)}
                  >
                    <ArrowClockwiseIcon
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                    Try again
                  </button>
                </div>
              )
            )}

            {externalWallets.length === 0 && (
              <a
                href={WALLET_INSTALL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center justify-center gap-2 rounded-lg border border-gray-200 p-3 text-sm font-medium transition-colors hover:border-blue-500 dark:border-gray-700 dark:hover:border-blue-400"
              >
                Don't have a wallet? Install Nulo
                <ArrowSquareOutIcon className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
          </div>
        )}
      </div>
    </>
  );

  return (
    <ResponsiveModal open={isOpen} onOpenChange={handleOpenChange}>
      <ResponsiveModalContent
        className="focus:outline-none"
        drawerClassName="px-4"
        dialogClassName="sm:max-w-[425px]"
      >
        {isMobile && (
          <div className="mx-auto mt-4 mb-5 h-1.5 w-12 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-700" />
        )}
        <ResponsiveModalHeader className={isMobile ? "p-0 pb-3 text-left" : ""}>
          <ResponsiveModalTitle className="text-xl font-bold">
            {verificationEmojis ? "Verify Connection" : "Connect Wallet"}
          </ResponsiveModalTitle>
          <ResponsiveModalDescription className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {verificationEmojis
              ? "Make sure you are connecting to your wallet"
              : "Select your preferred wallet connection method"}
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>
        <div className={isMobile ? "p-0 pb-8" : "py-4"}>
          {verificationEmojis ? (
            <EmojiVerification emojis={verificationEmojis} />
          ) : (
            <WalletOptions />
          )}
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};
