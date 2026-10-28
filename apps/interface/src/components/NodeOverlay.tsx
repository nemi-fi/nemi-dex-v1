"use client";

import React, { type FC, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Image from "#/components/Image.js";
import styles from "#/styles/NodeOverlay.module.css";
import { useLocation } from "react-router";

// The app pages draw their own background (see `.vibe-bg` in globals.css).
const APP_ROUTE_PREFIXES = ["/swap", "/pool"];

interface NodeOverlayProps {
  children?: React.ReactNode;
}

const NodeOverlay: FC<NodeOverlayProps> = ({ children }) => {
  const { theme, themes } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [showEncryptionBanner, setShowEncryptionBanner] = useState(true);
  const [showZkBanner, setShowZkBanner] = useState(true);
  const { pathname } = useLocation();
  const isAppRoute = APP_ROUTE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  // Only render theme-specific elements after mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);

    // Hide the banner after 5 seconds
    const timer = setTimeout(() => {
      setShowBanner(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Determine if dark mode based on resolvedTheme, with fallback
  const isDarkMode = mounted ? theme === "dark" : false;

  return (
    <div className="node-overlay relative w-full h-full overflow-hidden">
      {/* Background elements */}
      {mounted && !isAppRoute && (
        <>
          <div
            className={`absolute top-0 left-0 right-0 bottom-0 -z-20 ${
              isDarkMode
                ? "bg-[radial-gradient(#ffffff0d_1px,#00091d_1px)]"
                : "bg-[radial-gradient(#e5e7eb40_1px,transparent_1px)] backdrop-blur-sm"
            } bg-[size:35px_35px]`}
          />

          {/* Puzzle pieces background */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className={styles.node_one}>
              <Image
                src="/images/puzzle/blue.svg"
                width={220}
                height={220}
                alt="Blue Puzzle Piece"
                priority
                quality={75}
              />
            </div>

            <div className={styles.node_two}>
              <Image
                src="/images/puzzle/green.svg"
                width={220}
                height={220}
                alt="Green Puzzle Piece"
                priority
                quality={75}
              />
            </div>

            <div className={styles.node_three}>
              <Image
                src="/images/puzzle/green1.svg"
                width={220}
                height={220}
                alt="Green Puzzle Piece"
                quality={75}
              />
            </div>

            <div className={styles.node_four}>
              <Image
                src="/images/puzzle/orange.svg"
                width={320}
                height={320}
                alt="Orange Puzzle Piece"
                quality={75}
              />
            </div>

            <div className={styles.node_five}>
              <Image
                src="/images/puzzle/pink.svg"
                width={220}
                height={220}
                alt="Pink Puzzle Piece"
                quality={75}
              />
            </div>

            <div className={styles.node_six}>
              <Image
                src="/images/puzzle/yellow.svg"
                width={220}
                height={220}
                alt="Yellow Puzzle Piece"
                quality={75}
              />
            </div>

            <div className={styles.node_seven}>
              <Image
                src="/images/puzzle/yellow1.svg"
                width={140}
                height={140}
                alt="Yellow Puzzle Piece"
                quality={75}
              />
            </div>
          </div>
        </>
      )}
      {children}
    </div>
  );
};

export default NodeOverlay;
