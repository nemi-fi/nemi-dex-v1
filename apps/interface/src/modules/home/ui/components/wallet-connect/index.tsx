import { CryptoSidePanel } from "#/components/crypto-side-panel/index.js";
import { Button } from "#/components/ui/button.js";
import { useAccount } from "#/hooks/use-account.js";
import { cn } from "#/lib/utils.js";
import { sutils } from "@nemi-fi/utils";
import { Wallet } from "lucide-react";
import { useState } from "react";
import { WalletConnectModal } from "./WalletConnectModal.js";

interface WalletConnectProps {
  fullWidth?: boolean;
}

/** "Connect Wallet" button, or the connected address that opens the wallet side panel. */
export const WalletConnect = ({ fullWidth = false }: WalletConnectProps) => {
  const [showModal, setShowModal] = useState(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const account = useAccount();

  if (account) {
    return (
      <CryptoSidePanel isOpen={sidePanelOpen} onOpenChange={setSidePanelOpen}>
        <Button
          variant="outline"
          className={cn(
            "flex items-center gap-2 font-mono",
            fullWidth && "w-full",
          )}
          onClick={() => setSidePanelOpen(true)}
          id="wallet-menu-button"
        >
          <div
            className="h-2 w-2 animate-pulse rounded-full bg-green-400"
            aria-hidden="true"
          />
          <span className="text-sm">
            {sutils.shortenAddress(account.address)}
          </span>
          <Wallet className="h-4 w-4 opacity-70" aria-hidden="true" />
        </Button>
      </CryptoSidePanel>
    );
  }

  return (
    <>
      <Button
        size={fullWidth ? "cta" : "default"}
        className={cn(
          "bg-blue-600 font-medium text-white hover:bg-blue-700",
          !fullWidth && "h-10 rounded-lg px-4 py-2",
        )}
        onClick={() => setShowModal(true)}
        aria-label="Connect Wallet"
      >
        <Wallet className="mr-2 h-4 w-4" aria-hidden="true" />
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
