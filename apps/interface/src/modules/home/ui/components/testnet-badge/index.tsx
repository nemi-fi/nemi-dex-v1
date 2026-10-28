"use client";

import { motion } from "framer-motion";
import { showTestnetModal } from "../testnet-modal/index.js";

export const TestnetBadge = () => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={() => showTestnetModal()}
  >
    <div className="relative inline-flex items-center cursor-pointer group">
      <span className="text-[9px] font-medium tracking-wider text-white bg-[#ea789c] px-1.5 py-0.5 rounded-md backdrop-blur-sm shadow-sm select-none border border-white/10 flex items-center gap-1 transition-all group-hover:bg-[#ea789c]/90">
        <span className="relative flex h-1.5 w-1.5 mr-0.5">
          <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-white opacity-70"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
        </span>
        TESTNET
      </span>
    </div>
  </motion.div>
);
