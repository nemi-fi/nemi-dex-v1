import { LoadingButton } from "@/components/LoadingButton";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/hooks/use-account";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { lib } from "@/lib/sdk";
import { cn } from "@/lib/utils";
import { interfaceSdk } from "@nemi-fi/interface-sdk";
import { sutils } from "@nemi-fi/utils";
import { Copy, ExternalLink, Fingerprint, LogOut, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { WalletConnectModal } from "./WalletConnectModal";
import { CryptoSidePanel } from "@/components/crypto-side-panel";

interface WalletConnectProps {
  fullWidth?: boolean;
}

export const WalletConnect = ({ fullWidth = false }: WalletConnectProps) => {
  // State management
  const [showModal, setShowModal] = useState(false);
  const { copied, copy } = useCopyToClipboard();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);

  // Refs
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Hooks
  const account = useAccount();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handlers
  const handleCopyAddress = () => {
    if (!account) return;
    void copy(account.address.toString());
  };

  const handleDisconnect = async () => {
    await lib.wallet.disconnect();
    setDropdownOpen(false);
  };

  const handleWalletClick = () => {
    if (account) {
      setSidePanelOpen(true);
    } else {
      setShowModal(true);
    }
  };

  // If user is connected, show the account dropdown
  if (account) {
    return (
      <CryptoSidePanel isOpen={sidePanelOpen} onOpenChange={setSidePanelOpen}>
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="outline"
            className={cn(
              "font-mono flex items-center gap-2",
              fullWidth ? "w-full" : "",
            )}
            onClick={handleWalletClick}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            id="wallet-menu-button"
          >
            <div
              className="w-2 h-2 rounded-full bg-green-400 animate-pulse"
              aria-hidden="true"
            ></div>
            <span className="text-sm">
              {sutils.shortenAddress(account.address)}
            </span>
            <Wallet className="h-4 w-4 opacity-70" aria-hidden="true" />
          </Button>
        </div>
      </CryptoSidePanel>
    );
  }

  // Connect wallet button and modal
  return (
    <>
      <Button
        className={cn(
          "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors",
          fullWidth ? "w-full" : "",
        )}
        onClick={() => setShowModal(true)}
        aria-label="Connect Wallet"
      >
        <Wallet className="h-4 w-4 mr-2" aria-hidden="true" />
        Connect Wallet
      </Button>

      <WalletConnectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};

export default WalletConnect;
