import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@/components/ui/drawer";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useMediaQuery } from "@/hooks/use-media-query";
import { modals } from "@/lib/modal";
import { lib } from "@/lib/sdk";
import { useModal } from "@ebay/nice-modal-react";
import { sutils } from "@nemi-fi/utils";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Loader2,
  Shield,
  X,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { UnreachableCaseError } from "ts-essentials";
import { LoadingButton } from "./LoadingButton";
interface Props {
  sendTx: () => Promise<sutils.TxLike>;
  details?: React.ReactNode;
}

type TxState =
  | {
      type: "confirm";
    }
  | {
      type: "proving";
    }
  | {
      type: "sent";
      tx: sutils.TxLike;
    }
  | {
      type: "error";
      error: string;
    };

function CopyableHash({ hash }: { hash: string }) {
  const { copied, copy } = useCopyToClipboard();
  return (
    <button
      type="button"
      onClick={() => copy(hash)}
      title={hash}
      aria-label="Copy transaction hash"
      className="inline-flex items-center gap-1.5 text-sm text-zinc-900 dark:text-zinc-100 font-mono hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
    >
      {sutils.shortenTxHash(hash)}
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
      ) : (
        <Copy className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
      )}
    </button>
  );
}

export const TxModal = modals.create<Props>(({ details, sendTx }) => {
  const modal = useModal();
  const [txState, setTxState] = useState<TxState>({ type: "confirm" });
  const isMobile = useMediaQuery("(max-width: 768px)");
  const canCloseModal = txState.type !== "proving";

  const estimatedTime = "~2 minutes";

  // Handle confirmation and transaction execution
  const handleConfirm = async () => {
    try {
      setTxState({ type: "proving" });

      const tx = await sendTx();

      setTxState({ type: "sent", tx });
    } catch (err) {
      setTxState({
        type: "error",
        error: sutils.errorToString(err) || "Transaction failed.",
      });
      throw err;
    }
  };

  const handleClose = () => {
    modal.remove();
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      return;
    }
    if (!canCloseModal) {
      return;
    }
    modal.remove();
  };

  const getStateContent = () => {
    switch (txState.type) {
      case "confirm":
        return (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={contentVariants}
            key={txState.type}
            className="space-y-6"
          >
            {/* Transaction overview section */}
            <div className="rounded-lg border overflow-hidden relative">
              {/* Animated subtle gradient background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-gray-50 via-blue-50/30 to-gray-50 dark:from-gray-950 dark:via-blue-950/20 dark:to-gray-950 opacity-80"
                animate={{
                  backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "linear",
                }}
              />

              {/* Transaction header with privacy indicator */}
              <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 border-b flex justify-between items-center relative z-10">
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-blue-500" />
                  Privacy-Protected Transaction
                </div>
              </div>
            </div>

            {/* Transaction details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Transaction Details</h3>
              </div>

              <div className="w-full space-y-2 rounded-lg border p-3 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 backdrop-blur-sm shadow-sm">
                {details}
                <TransactionDetailRow
                  icon={<Clock size={12} className="h-4 w-4" />}
                  label="Estimated Time"
                  value={estimatedTime}
                  bgClass="bg-purple-50 dark:bg-purple-900/20"
                />
                <TransactionDetailRow
                  icon={<Shield className="h-4 w-4" />}
                  label="Network Fee"
                  value={
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 line-through">
                        ~$2.50
                      </span>
                      <span className="text-xs text-green-500 font-medium">
                        Sponsored by Nemi
                      </span>
                    </div>
                  }
                  bgClass="bg-emerald-50 dark:bg-emerald-900/20"
                />
              </div>
            </div>
          </motion.div>
        );

      case "proving":
        return (
          <motion.div
            key={txState.type}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="py-8 flex flex-col items-center justify-center"
          >
            <div className="relative">
              <div className="relative flex items-center justify-center">
                {/* Animated background and spinner */}
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <motion.div
                    className="absolute inset-0 blur-xl bg-blue-500/10 rounded-full"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut",
                    }}
                  />
                  <motion.div
                    className="relative z-20"
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Loader2 size={48} className="text-blue-500" />
                  </motion.div>
                </div>
              </div>
            </div>

            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <h3 className="text-lg font-medium mb-1">
                Generating a Zero-Knowledge Proof
              </h3>
              <div className="flex flex-col gap-1">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  It may take 1-2 minutes. Please don't close this window
                </p>
              </div>

              {details && (
                <div className="space-y-2 rounded-lg border p-3 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 backdrop-blur-sm shadow-sm mt-3">
                  {details}
                </div>
              )}
            </motion.div>
          </motion.div>
        );

      case "sent":
        return (
          <motion.div
            key={txState.type}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="py-4 flex flex-col items-center"
          >
            <motion.div
              className="flex justify-center mb-4"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </motion.div>

            <motion.div
              className="text-center mb-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
            >
              <motion.p
                className="text-sm text-zinc-600 dark:text-zinc-400 max-w-[240px] mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.4 }}
              >
                Your transaction is being processed by the network.
              </motion.p>
            </motion.div>
            {details && (
              <div className="space-y-2 rounded-lg border p-3 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 backdrop-blur-sm shadow-sm my-3">
                {details}
              </div>
            )}

            <div className="px-1">
              <span className="text-sm text-zinc-500">Transaction Hash:</span>{" "}
              <CopyableHash hash={txState.tx.hash.toString()} />
            </div>
          </motion.div>
        );

      case "error":
        return (
          <motion.div
            key="error-view"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="py-8 flex flex-col items-center justify-center"
          >
            <div className="relative">
              <div className="relative flex items-center justify-center">
                {/* Error icon */}
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <motion.div
                    className="absolute inset-0 blur-xl bg-red-500/10 rounded-full"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1.2 }}
                    transition={{ duration: 0.8 }}
                  />
                  <motion.div
                    className="relative z-20 text-red-500"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                  >
                    <AlertTriangle size={48} />
                  </motion.div>
                </div>
              </div>
            </div>

            <motion.div
              className="mt-6 text-center"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <h3 className="text-lg font-medium mb-1">Transaction Failed</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-[250px] mx-auto">
                {txState.error ||
                  "Something went wrong with your transaction. Please try again."}
              </p>
            </motion.div>
          </motion.div>
        );

      default:
        throw new UnreachableCaseError(txState);
    }
  };

  // Get buttons based on current state
  const getStateButtons = () => {
    switch (txState.type) {
      case "confirm":
        return (
          <>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <LoadingButton onClick={handleConfirm}>Confirm</LoadingButton>
          </>
        );

      case "proving":
        return null;

      case "sent":
        return (
          <motion.div
            key={txState.type}
            className="w-full flex sm:flex-row flex-col gap-2"
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ delay: 1.3, duration: 0.4 }}
          >
            <Button className="sm:w-1/2" asChild>
              <Link
                href={lib.core.explorerUrl.tx(txState.tx.hash)}
                target="_blank"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Explorer
              </Link>
            </Button>
            <Button
              variant="outline"
              className="sm:w-1/2"
              onClick={handleClose}
            >
              Close
            </Button>
          </motion.div>
        );

      case "error":
        return (
          <motion.div
            key="error-buttons"
            className="w-full flex flex-col sm:flex-row gap-2"
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Button
              variant="outline"
              onClick={handleClose}
              className="sm:flex-1 py-3 border-gray-200 dark:border-gray-700"
            >
              Close
            </Button>
          </motion.div>
        );

      default:
        throw new UnreachableCaseError(txState);
    }
  };

  // Shared header content between Dialog and Drawer
  const headerContent = (
    <>
      <motion.div
        className="flex flex-col items-center text-center"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          key={`title-${txState}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="relative">
            <div className="absolute right-0 top-0 sm:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={handleClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold">
              {sutils.iife(() => {
                switch (txState.type) {
                  case "confirm":
                    return "Review Transaction";
                  case "proving":
                    return "Sending Transaction";
                  case "sent":
                    return "Transaction Sent";
                  case "error":
                    return "Transaction Failed";
                  default:
                    throw new UnreachableCaseError(txState);
                }
              })}
            </h2>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {sutils.iife(() => {
            switch (txState.type) {
              case "confirm":
                return "Review the transaction details before confirming.";
              case "proving":
                return "Your privacy-protected transaction is being created...";
              case "sent":
                return "Your private transaction was successfully sent to the network.";
              case "error":
                return "There was an error sending your private transaction.";
              default:
                throw new UnreachableCaseError(txState);
            }
          })}
        </AnimatePresence>
      </motion.div>
    </>
  );

  // Shared content between Dialog and Drawer
  const contentSection = (
    <>
      <div className="overflow-hidden">
        <AnimatePresence mode="wait">{getStateContent()}</AnimatePresence>
      </div>
    </>
  );

  // Shared footer between Dialog and Drawer
  const footerSection = (
    <AnimatePresence mode="wait">{getStateButtons()}</AnimatePresence>
  );

  return isMobile ? (
    <Drawer open={modal.visible} onOpenChange={handleOpenChange}>
      <DrawerContent className="px-5 pb-10 pt-6 max-h-[90vh]">
        <DrawerHeader className="pb-4">{headerContent}</DrawerHeader>

        {contentSection}

        <DrawerFooter className="mt-6 pb-safe">{footerSection}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  ) : (
    <Dialog open={modal.visible} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md max-h-[80vh] overflow-y-auto"
        closeButton={canCloseModal}
      >
        <DialogHeader className="pb-2">{headerContent}</DialogHeader>

        {contentSection}

        <DialogFooter className="mt-4 sm:mt-6">{footerSection}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

// Compact transaction detail row
export const TransactionDetailRow = ({
  icon,
  label,
  value,
  bgClass = "bg-blue-50 dark:bg-blue-900/20",
  valueExtraClass = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  bgClass?: string;
  valueExtraClass?: string;
}) => (
  <div className="flex justify-between items-center py-1.5">
    <div className="flex items-center gap-2">
      <div
        className={`w-5 h-5 rounded-full ${bgClass} flex items-center justify-center flex-shrink-0`}
      >
        {icon}
      </div>
      <span className="text-xs text-zinc-600 dark:text-zinc-400">{label}</span>
    </div>
    <span
      className={`text-xs text-zinc-800 dark:text-zinc-200 font-medium ${valueExtraClass}`}
    >
      {value}
    </span>
  </div>
);

// Animation variants for smoother transitions
const contentVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
};

const fadeVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};
