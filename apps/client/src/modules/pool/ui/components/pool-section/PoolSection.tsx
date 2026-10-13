"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PoolCards } from "./PoolCards";

export const PoolSection = () => {
  return (
    <>
      {/* Main content container with improved mobile spacing */}
      <div className="w-full max-w-[98%] sm:max-w-[95%] md:max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-10">
        {/* Mobile-optimized header with stacked layout on small screens */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-5 sm:mb-8">
          <div className="w-full sm:w-auto text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight">
              Liquidity Pools
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm max-w-md">
              Provide liquidity to earn fees and rewards
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Token selection not work at the moment */}
            {/* <Button
              variant="default"
              className="shadow-sm w-full sm:w-auto justify-center h-12 sm:h-10 rounded-xl sm:rounded-md text-base sm:text-sm"
              asChild
            >
              <Link href="/pool/add-liquidity">
                <span>Add Liquidity</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </Link>
            </Button> */}
          </div>
        </div>

        {/* Main card containing the pool list - improved for mobile */}
        <PoolCards />

        {/* Bottom note section with better padding on mobile */}
        <div className="mt-5 sm:mt-6 text-center text-xs text-muted-foreground font-light max-w-xl mx-auto px-3">
          Liquidity providers earn a fee on all trades proportional to their
          share of the pool
        </div>
      </div>
    </>
  );
};
