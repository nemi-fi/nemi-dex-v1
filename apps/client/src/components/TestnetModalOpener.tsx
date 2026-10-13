"use client";

import { useEffect } from "react";
import { showTestnetModal } from "@/modules/home/ui/components/testnet-modal";

export function TestnetModalOpener() {
  useEffect(() => {
    // Open the testnet modal when the component mounts
    const openTestnetModal = async () => {
      // Small delay to ensure the page has loaded properly
      setTimeout(() => {
        showTestnetModal();
      }, 500);
    };

    openTestnetModal();
  }, []);

  // This component doesn't render anything
  return null;
}
