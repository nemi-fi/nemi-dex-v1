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
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Plus, Wallet as WalletIcon } from "lucide-react";
import { useEffect, useState } from "react";

type ConnectParams = interfaceSdk.ConnectParams;

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletConnectModal = ({
  isOpen,
  onClose,
}: WalletConnectModalProps) => {
  const [showOtherWallets, setShowOtherWallets] = useState(false);
  const isMobile = useIsMobile();

  const isConnecting = useSvelte(() => lib.wallet.isConnecting);
  const verificationEmoji = useSvelte(() => lib.wallet.verificationEmoji);
  const accounts = useSvelte(() => lib.wallet.accounts);

  // The embedded wallet starts lazily (it boots a PXE); load its accounts once the modal opens.
  useEffect(() => {
    if (isOpen) {
      lib.wallet.loadAccounts().catch((error) => {
        console.error("Failed to load embedded accounts:", error);
      });
    }
  }, [isOpen]);

  // Discover external wallets once "Other Wallets" is expanded.
  const { data: externalWallets = [], isFetching: isDiscovering } = useQuery({
    queryKey: ["discover-external-wallets"],
    queryFn: () => lib.wallet.discoverWallets(),
    enabled: showOtherWallets,
    staleTime: 0,
  });

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

  const WalletOptions = () => (
    <>
      {/* Verification emoji for external wallet connections */}
      {verificationEmoji && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{verificationEmoji}</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Verify Connection
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Check this matches the emoji shown in your wallet
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Primary Option - Embedded wallet */}
      <div className="mb-6">
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
            <Plus className="h-5 w-5" aria-hidden="true" />
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
      <div className="relative mb-6">
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
          className={cn(
            "w-full text-left font-medium flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors",
            showOtherWallets ? "bg-gray-50 dark:bg-gray-700/50" : "",
          )}
          onClick={() => setShowOtherWallets(!showOtherWallets)}
        >
          <span>Connect with Other Wallets</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              showOtherWallets ? "rotate-180" : "",
            )}
            aria-hidden="true"
          />
        </button>

        {showOtherWallets && (
          <div className="overflow-hidden transition-all duration-300">
            {isDiscovering ? (
              <div className="flex items-center justify-center p-4">
                <Spinner className="h-5 w-5" />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  Discovering wallets...
                </span>
              </div>
            ) : externalWallets.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 mt-3">
                {externalWallets.map((wallet, idx) => (
                  <button
                    key={idx}
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
            ) : (
              <div className="text-center p-4 text-sm text-gray-500 dark:text-gray-400">
                No external wallets found. Install a compatible Aztec wallet
                extension.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );

  return (
    <ResponsiveModal open={isOpen} onOpenChange={onClose}>
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
            Connect Wallet
          </ResponsiveModalTitle>
          <ResponsiveModalDescription className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Select your preferred wallet connection method
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>
        <div className={isMobile ? "p-0 pb-8" : "py-4"}>
          <WalletOptions />
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};
