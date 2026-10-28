"use client";

import { Badge } from "#/components/ui/badge.js";
import { X, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogClose } from "#/components/ui/dialog.js";
import { modals } from "#/lib/modal.js";
import { useModal } from "@ebay/nice-modal-react";
import { useTheme } from "next-themes";
import { cn } from "#/lib/utils.js";

// Create the modal component using the eBay NiceModal system
export const TestnetModal = modals.create(() => {
  const modal = useModal();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleOpenChange = (open: boolean) => {
    if (!open) modal.remove();
  };

  return (
    <Dialog open={modal.visible} onOpenChange={handleOpenChange}>
      <DialogContent
        style={{
          minWidth: "100%",
          backdropFilter: "blur(2px)",
        }}
        className={cn(
          "max-w-full h-screen w-full m-0 p-0 rounded-none border-none overflow-hidden",
          isDark ? "bg-black" : "bg-white",
        )}
      >
        {/* Full page content container */}
        <div className="justify-between w-full h-full flex flex-col items-center overflow-auto py-16 px-4">
          <div className="max-w-4xl w-full mx-auto">
            {/* Header section */}
            <div className="text-center mt-0 mb-12 ">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-5"
              >
                <Badge className="bg-[#ea789c] backdrop-blur-xl text-white px-6 py-2 text-sm font-medium uppercase tracking-wider shadow-lg">
                  Testnet Release
                </Badge>
              </motion.div>

              <motion.h1
                className={cn(
                  "text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-center mb-4",
                  isDark ? "text-white" : "text-gray-800",
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Testnet Information
              </motion.h1>

              <motion.p
                className={cn(
                  "text-base sm:text-lg max-w-2xl mx-auto text-center",
                  isDark ? "text-white/80" : "text-gray-600",
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                You're exploring an early version of our platform running on
                testnet.
              </motion.p>
            </div>

            {/* Features section */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.08,
                  },
                },
              }}
              initial="hidden"
              animate="visible"
            >
              {[
                {
                  emoji: "🧪",
                  title: "Test Network",
                  description:
                    "Running on testnet environment with no real assets at risk.",
                },
                {
                  emoji: "💻",
                  title: "Development Mode",
                  description: "Features may change as development progresses.",
                },
                {
                  emoji: "🔮",
                  title: "Coming Soon",
                  description:
                    "Enhanced functionality and third-party integrations.",
                },
                {
                  emoji: "🐛",
                  title: "Expect Bugs",
                  description: "Your feedback helps us improve the platform.",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.4 },
                    },
                  }}
                  whileHover={{
                    backgroundColor: isDark
                      ? "rgba(234, 120, 156, 0.08)"
                      : "rgba(234, 120, 156, 0.04)",
                    borderColor: isDark
                      ? "rgba(234, 120, 156, 0.3)"
                      : "rgba(234, 120, 156, 0.2)",
                    scale: 1.02,
                  }}
                  className={cn(
                    "backdrop-blur-md border rounded-xl p-6 transition-all duration-200 flex items-start gap-4",
                    isDark
                      ? "bg-white/5 border-white/10"
                      : "bg-gray-50/80 border-gray-200",
                  )}
                >
                  <div className="text-2xl sm:text-3xl flex-shrink-0">
                    {feature.emoji}
                  </div>
                  <div>
                    <h3
                      className={cn(
                        "text-base sm:text-lg font-medium mb-1",
                        isDark ? "text-white" : "text-gray-800",
                      )}
                    >
                      {feature.title}
                    </h3>
                    <p
                      className={cn(
                        "text-sm",
                        isDark ? "text-white/70" : "text-gray-600",
                      )}
                    >
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Footer section */}
            <motion.div
              className="w-full max-w-lg mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <p
                className={cn(
                  "text-center text-sm sm:text-base max-w-lg mx-auto mb-6",
                  isDark ? "text-white/70" : "text-gray-600",
                )}
              >
                Thank you for being an early explorer. Your feedback is valuable
                as we continue to build.
              </p>

              <DialogClose asChild>
                <motion.button
                  whileHover={{
                    scale: 1.03,
                    boxShadow: "0 0 30px rgba(234, 120, 156, 0.4)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  className="w-full px-8 py-4 bg-[#ea789c] text-white rounded-full text-base font-medium transition-all flex items-center justify-center shadow-md hover:shadow-xl mx-auto"
                  onClick={() => modal.remove()}
                >
                  <span>Continue to the app</span>
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </motion.button>
              </DialogClose>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

// Helper function to show the testnet modal
export const showTestnetModal = () => {
  return modals.show(TestnetModal, { id: "testnet-modal" });
};
