import { Button } from "#/components/ui/button.js";
import { Skeleton } from "#/components/ui/skeleton.js";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "#/components/ui/tooltip.js";
import { useAccount } from "#/hooks/use-account.js";
import { useBalances } from "#/lib/queries.js";
import { lib } from "#/lib/sdk.js";
import { formatUsd } from "#/lib/format.js";
import { calculateUsdValue } from "#/lib/prices.js";
import { interfaceSdk } from "@nemi-fi/interface-sdk";
import { sutils } from "@nemi-fi/utils";
import { compact, sum } from "lodash-es";
import {
  Check,
  CircleDollarSign,
  Copy,
  ExternalLink,
  Fingerprint,
  LogOut,
} from "lucide-react";
import { Link } from "react-router";
import { useCopyToClipboard } from "#/hooks/use-copy-to-clipboard.js";

interface WalletHeaderProps {}

export function WalletHeader({}: WalletHeaderProps) {
  const { copied, copy } = useCopyToClipboard();
  const account = useAccount();
  const balances = useBalances(account);

  // Calculate total balance in USD
  const totalBalance = sum(
    compact(balances.map((x) => x.data)).map((x) => calculateUsdValue(x)),
  );

  const handleDisconnect = async () => {
    await lib.wallet.disconnect();
  };

  const copyToClipboard = () => {
    if (!account) return;
    void copy(account.address.toString());
  };

  return (
    <div className="relative overflow-hidden">
      {/* Card Container */}
      <div className="relative rounded-xl bg-gradient-to-br from-gray-900 via-gray-800 to-black p-5 shadow-xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/images/bg.png')] bg-cover bg-center" />
        </div>

        {/* Glass overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-white/5 rounded-xl" />

        {/* Content */}
        <div className="relative flex flex-col gap-4">
          {/* Header Section */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs text-white/60 flex items-center gap-1.5 bg-white/10 rounded-full py-1 px-2.5">
                  {lib.wallet.type === interfaceSdk.WalletType.local && (
                    <Fingerprint className="h-3 w-3" />
                  )}
                  <span className="font-medium">{lib.wallet.type}</span>
                </div>
              </div>
              <p className="text-xs text-white/60">Total Balance</p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8 rounded-full"
                    onClick={handleDisconnect}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Disconnect wallet</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Balance Display */}
          <div className="-mt-2">
            {balances.some((x) => x.isLoading) ? (
              <Skeleton className="h-10 w-36 bg-white/20" />
            ) : (
              <div
                key={totalBalance}
                className="text-3xl font-bold text-white animate-in fade-in-0 zoom-in-90"
              >
                {formatUsd(totalBalance)}
              </div>
            )}
            <p className="text-xs text-white/40 mt-1">Available in wallet</p>
          </div>

          {/* Address Section */}

          <div className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4 text-white/60" />
              <span className="text-sm font-medium text-white/90">
                {sutils.shortenAddress(account?.address || "")}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <IconAction
                tooltip={copied ? "Copied!" : "Copy address"}
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </IconAction>
              <IconAction tooltip="View on explorer" asChild>
                <Link
                  to={lib.core.explorerUrl.address(account?.address || "")}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View on explorer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </IconAction>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Round icon button with a tooltip, for the address actions. */
function IconAction({
  tooltip,
  ...props
}: React.ComponentProps<typeof Button> & { tooltip: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full border border-white/5 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            {...props}
          />
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
