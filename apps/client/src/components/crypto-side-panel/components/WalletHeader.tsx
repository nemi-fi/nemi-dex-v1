import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAccount } from "@/hooks/use-account";
import { useBalances } from "@/lib/queries";
import { lib } from "@/lib/sdk";
import { calculateUsdValue } from "@/modules/home/ui/components/swap-section/constants";
import { interfaceSdk } from "@nemi-fi/interface-sdk";
import { sutils } from "@nemi-fi/utils";
import { motion } from "framer-motion";
import { compact, sum } from "lodash-es";
import {
  Check,
  CircleDollarSign,
  Copy,
  ExternalLink,
  Fingerprint,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, type: "spring" }}
      className="relative overflow-hidden"
    >
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
                <div className="text-xs text-white/60 flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full py-1 px-2.5">
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
              <motion.div
                key={totalBalance}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="text-3xl font-bold text-white"
              >
                $
                {totalBalance.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </motion.div>
            )}
            <p className="text-xs text-white/40 mt-1">Available in wallet</p>
          </div>

          {/* Address Section */}

          <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4 text-white/60" />
              <span className="text-sm font-medium text-white/90">
                {sutils.shortenAddress(account?.address || "")}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-sm border border-white/5"
                      onClick={copyToClipboard}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {copied ? "Copied!" : "Copy address"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-sm border border-white/5"
                      asChild
                    >
                      <Link
                        href={lib.core.explorerUrl.address(
                          account?.address || "",
                        )}
                        target="_blank"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View on explorer</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
