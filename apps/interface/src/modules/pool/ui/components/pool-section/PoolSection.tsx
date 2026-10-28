"use client";

import { PoolCards } from "./PoolCards.js";

export const PoolSection = () => {
  return (
    <>
      {/* Main content container with improved mobile spacing */}
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        {/* Mobile-optimized header with stacked layout on small screens */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <div className="w-full sm:w-auto text-center sm:text-left">
            <h1 className="text-3xl font-bold mb-3">Liquidity Pools</h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Provide liquidity to earn fees and rewards
            </p>
          </div>
        </div>

        {/* Main card containing the pool list - improved for mobile */}
        <PoolCards />

        {/* Bottom note section with better padding on mobile */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400 max-w-xl mx-auto px-3">
          Liquidity providers earn a fee on all trades proportional to their
          share of the pool
        </div>
      </div>
    </>
  );
};
