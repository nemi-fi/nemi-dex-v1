"use client";

import { showTestnetModal } from "@/modules/home/ui/components/testnet-modal";
import styles from "@/styles/NodeOverlay.module.css";
import {
  ActivitySquare,
  AlertTriangle,
  Info,
  ShieldAlert,
  Smartphone,
  X,
} from "lucide-react";
import Image from "next/image";
import React, { useState, useEffect } from "react";

interface GlobalAlertsProps {
  children: React.ReactNode;
}

export function GlobalAlerts({ children }: GlobalAlertsProps) {
  const [showSpoilerWarning, setShowSpoilerWarning] = useState(false);
  const [showCongestionAlert, setShowCongestionAlert] = useState(false); // TODO: remove this

  useEffect(() => {
    const hasAccepted = localStorage.getItem("hasAcceptedWarning");
    if (!hasAccepted) {
      setShowSpoilerWarning(true);
    }
  }, []);

  const handleAcceptWarning = () => {
    // Wait for fade out animation to complete
    setTimeout(() => {
      localStorage.setItem("hasAcceptedWarning", "true");
      setShowSpoilerWarning(false);
    }, 200);
  };

  const handleOpenTestnetModal = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    handleAcceptWarning();
    showTestnetModal();
  };

  const handleDismissCongestionAlert = () => {
    setShowCongestionAlert(false);
    localStorage.setItem("dismissedCongestionAlert", Date.now().toString());
  };

  return (
    <>
      <div className={showSpoilerWarning ? "overflow-hidden" : ""}>
        {showCongestionAlert && (
          <div
            className="fixed top-0 left-0 right-0 shadow-md z-[100] transition-opacity duration-200 ease-in-out"
            role="alert"
            aria-live="polite"
          >
            <div className="bg-gradient-to-r from-red-200 to-red-300 dark:from-red-700 dark:to-red-800 text-red-800 dark:text-white">
              <div className="max-w-7xl mx-auto relative">
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-400/0 via-red-500/80 to-red-400/0 dark:via-red-300/80"></div>

                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/20 dark:bg-white/10 border border-red-500/30 dark:border-white/20">
                      <ActivitySquare
                        className="w-5 h-5 text-red-700 dark:text-white"
                        aria-hidden="true"
                      />
                    </span>

                    <p className="text-red-800 dark:text-white font-medium text-sm">
                      <strong>Network Alert:</strong>
                      <span className="ml-1.5">
                        The Aztec Testnet is congested right now. Your
                        transactions may take longer or may be dropped.
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={handleDismissCongestionAlert}
                    className="ml-3 p-1.5 rounded-lg hover:bg-red-500/10 dark:hover:bg-white/10 active:bg-red-500/20 dark:active:bg-white/20 transition-colors"
                    aria-label="Dismiss congestion alert"
                  >
                    <X
                      className="w-5 h-5 text-red-800 dark:text-white"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TestNet Warning Modal */}
        {showSpoilerWarning && (
          <div
            className="fixed inset-0 bg-gray-100/95 dark:bg-black/95 backdrop-blur-xl z-[9999] flex items-center justify-center transition-opacity duration-200 ease-in-out overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="testnet-warning-title"
          >
            <div className="w-full min-h-screen sm:min-h-0 flex items-center justify-center p-4 sm:p-10">
              <div className="max-w-2xl w-full sm:w-auto relative my-4 sm:my-0">
                {/* Floating puzzle pieces - hidden on mobile */}
                <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-20 hidden sm:block">
                  <div className={styles.node_one}>
                    <Image
                      src="/images/puzzle/blue.svg"
                      width={180}
                      height={180}
                      alt="Blue Puzzle Piece"
                      priority
                      quality={75}
                      className="opacity-40"
                    />
                  </div>
                  <div className={styles.node_two}>
                    <Image
                      src="/images/puzzle/green.svg"
                      width={150}
                      height={150}
                      alt="Green Puzzle Piece"
                      priority
                      quality={75}
                      className="opacity-30"
                    />
                  </div>
                  <div className={styles.node_three}>
                    <Image
                      src="/images/puzzle/orange.svg"
                      width={120}
                      height={120}
                      alt="Orange Puzzle Piece"
                      quality={75}
                      className="opacity-25"
                    />
                  </div>
                  <div className={styles.node_four}>
                    <Image
                      src="/images/puzzle/pink.svg"
                      width={100}
                      height={100}
                      alt="Pink Puzzle Piece"
                      quality={75}
                      className="opacity-20"
                    />
                  </div>
                </div>

                {/* Background effects - hidden on mobile */}
                <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-gradient-to-br from-blue-300/40 to-purple-300/40 dark:from-blue-500/20 dark:to-purple-500/20 rounded-full blur-3xl opacity-40 hidden sm:block"></div>
                <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-gradient-to-br from-amber-300/40 to-red-300/40 dark:from-amber-500/20 dark:to-red-500/20 rounded-full blur-3xl opacity-40 hidden sm:block"></div>

                <div className="bg-white/90 dark:bg-black/90 backdrop-blur-2xl rounded-2xl border border-gray-200/50 dark:border-white/10 shadow-xl dark:shadow-2xl p-5 sm:p-10 relative">
                  {/* Icon header */}
                  <div className="flex justify-center mb-4 sm:mb-6">
                    <span className="relative inline-block">
                      <span className="absolute -inset-3 bg-gradient-to-r from-amber-300/80 to-red-300/80 dark:from-amber-500/80 dark:to-red-500/80 rounded-full opacity-75 blur-xl"></span>
                      <span className="relative bg-white/80 dark:bg-black/80 border border-amber-400/50 dark:border-white/30 p-3 sm:p-4 rounded-full border flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20">
                        <ShieldAlert
                          className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600 dark:text-amber-400"
                          aria-hidden="true"
                        />
                      </span>
                    </span>
                  </div>

                  <h2
                    id="testnet-warning-title"
                    className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white mb-4 sm:mb-6 tracking-tight"
                  >
                    Welcome to TestNet
                  </h2>

                  <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                    <article className="bg-amber-50/80 dark:bg-black/60 border border-amber-300/50 dark:border-amber-500/30 hover:border-amber-300/80 dark:hover:border-amber-500/50 rounded-xl p-4 sm:p-5 transition-all duration-200 hover:shadow-lg group">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 p-2 rounded-lg bg-amber-100 dark:bg-amber-500/20 group-hover:scale-110 transition-transform duration-200">
                          <AlertTriangle
                            className="w-6 h-6 text-amber-600 dark:text-amber-400"
                            aria-hidden="true"
                          />
                        </span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-base sm:text-lg text-amber-700 dark:text-amber-300 mb-1 sm:mb-1.5">
                            TestNet Version
                          </h3>
                          <p className="text-amber-800/90 dark:text-amber-100/90 text-sm leading-relaxed">
                            Test environment with no real-world token value.
                            Expect bugs and data resets.
                          </p>
                        </div>
                      </div>
                    </article>

                    <article className="bg-blue-50/80 dark:bg-black/60 border border-blue-300/50 dark:border-blue-500/30 hover:border-blue-300/80 dark:hover:border-blue-500/50 rounded-xl p-4 sm:p-5 transition-all duration-200 hover:shadow-lg group">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 p-2 rounded-lg bg-blue-100 dark:bg-blue-500/20 group-hover:scale-110 transition-transform duration-200">
                          <Smartphone
                            className="w-6 h-6 text-blue-600 dark:text-blue-400"
                            aria-hidden="true"
                          />
                        </span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-base sm:text-lg text-blue-700 dark:text-blue-300 mb-1 sm:mb-1.5">
                            Mobile Experience
                          </h3>
                          <p className="text-blue-800/90 dark:text-blue-100/90 text-sm leading-relaxed">
                            Mobile is not supported yet. Please use a computer
                            to send transactions meanwhile.
                          </p>
                        </div>
                      </div>
                    </article>
                  </div>

                  <div className="flex flex-col gap-2.5 sm:gap-3">
                    <button
                      onClick={handleAcceptWarning}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-400 dark:from-amber-600 dark:to-amber-500 hover:from-amber-400 hover:to-amber-300 dark:hover:from-amber-500 dark:hover:to-amber-400 text-white font-medium py-3.5 px-4 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Accept & Continue
                    </button>

                    <button
                      onClick={handleOpenTestnetModal}
                      className="w-full flex items-center justify-center gap-2.5 text-gray-800 dark:text-white bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 border border-gray-200 dark:border-white/20 px-4 py-3.5 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Info
                        className="w-5 h-5 text-amber-600 dark:text-amber-300"
                        aria-hidden="true"
                      />
                      <span>TestNet Information</span>
                    </button>
                  </div>

                  <p className="text-gray-500 dark:text-gray-400 text-xs text-center mt-5">
                    By continuing, you accept the limitations of this test
                    environment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Render children - they'll be hidden by overflow if modal is shown */}
      {children}
    </>
  );
}
