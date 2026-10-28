"use client";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import Image from "#/components/Image.js";
import { AspectRatio } from "#/components/ui/aspect-ratio.js";
import { Link } from "react-router";

export default function DefiPuzzle() {
  const [hoveredPiece, setHoveredPiece] = useState<string | null>(null);

  return (
    <section
      className="py-20 relative overflow-hidden"
      aria-labelledby="defi-puzzle-heading"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-12">
            {/* Text Content */}
            <div className="reveal w-full lg:w-1/2">
              <h2
                id="defi-puzzle-heading"
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#000000] dark:text-white mb-6"
              >
                Solving the DeFi Privacy Puzzle
              </h2>

              <p
                className="mb-6 text-gray-800 dark:text-gray-200"
                style={{ lineHeight: "38px", fontWeight: "600" }}
              >
                Nemi combines the best of{" "}
                <span className="bg-[#E9661E] text-white px-2 py-1 rounded-full">
                  deep liquidity
                </span>{" "}
                with{" "}
                <span className="bg-[#4382BD] text-white px-2 py-1 rounded-full">
                  decentralised privacy
                </span>{" "}
                to create a trading experience that's both{" "}
                <span className="bg-[#F5BD28] text-white px-2 py-1 rounded-full">
                  powerful and private
                </span>
              </p>

              <ul
                className="space-y-3 mb-8 text-gray-700 dark:text-gray-300"
                role="list"
              >
                <li className="flex items-start">
                  <span
                    className="text-black dark:text-white mr-2"
                    aria-hidden="true"
                  >
                    ·
                  </span>
                  <span>Private, non-custodial trading</span>
                </li>
                <li className="flex items-start">
                  <span
                    className="text-black dark:text-white mr-2"
                    aria-hidden="true"
                  >
                    ·
                  </span>
                  <span>
                    Deep liquidity for minimal slippage and fair pricing
                  </span>
                </li>
                <li className="flex items-start">
                  <span
                    className="text-black dark:text-white mr-2"
                    aria-hidden="true"
                  >
                    ·
                  </span>
                  <span>MEV protection for your transactions</span>
                </li>
                <li className="flex items-start">
                  <span
                    className="text-black dark:text-white mr-2"
                    aria-hidden="true"
                  >
                    ·
                  </span>
                  <span>Simple interface with real-time market data</span>
                </li>
              </ul>

              <Link
                to="/swap"
                className="inline-flex items-center gap-2 bg-black dark:bg-gray-800 text-white px-6 py-3 rounded-full hover:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-300 transform hover:translate-x-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label="Explore the DeFi privacy solution"
              >
                Explore the Solution
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>

            {/* Puzzle Visualization - Using Full Puzzle SVG */}
            <div className="reveal-side w-full lg:w-1/2 mt-8 lg:mt-0">
              <div className="max-w-[600px] mx-auto">
                <AspectRatio ratio={1} className="relative">
                  {/* Animated Particles
                  <div
                    className="absolute w-full h-full z-10 pointer-events-none"
                    aria-hidden="true"
                  >
                    <div className="particle particle-1"></div>
                    <div className="particle particle-2"></div>
                    <div className="particle particle-3"></div>
                    <div className="particle particle-4"></div>
                    <div className="particle particle-5"></div>
                    <div className="particle particle-6"></div>
                    <div className="particle particle-7"></div>
                    <div className="particle particle-8"></div>
                  </div> */}
                  {/* Full Puzzle SVG */}
                  <div
                    className="w-full h-full relative group"
                    role="img"
                    aria-label="Interactive DeFi privacy puzzle visualization"
                  >
                    <Image
                      src="/images/puzzle/full_pazzle.svg"
                      alt=""
                      fill
                      className="object-contain transition-all duration-500 animate-float-infinite"
                      priority
                      style={{
                        filter: hoveredPiece
                          ? "drop-shadow(0 0 12px rgba(0, 0, 0, 0.2))"
                          : "drop-shadow(0 0 5px rgba(0, 0, 0, 0.1))",
                        transition: "filter 0.3s ease",
                      }}
                      role="presentation"
                    />

                    {/* Interactive Hover Areas */}
                    {/* Center - PRIVACY */}
                    <div
                      className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] z-20 cursor-pointer transition-all duration-300 hover:scale-110 ${
                        hoveredPiece === "privacy" ? "animate-pulse-strong" : ""
                      }`}
                      onMouseEnter={() => setHoveredPiece("privacy")}
                      onMouseLeave={() => setHoveredPiece(null)}
                      aria-label="Privacy puzzle piece"
                      role="button"
                      tabIndex={0}
                    />

                    {/* Top Left - OWNERSHIP */}
                    <div
                      className={`absolute top-[15%] left-[15%] w-[30%] h-[30%] z-10 cursor-pointer transition-all duration-300 hover:scale-110 ${
                        hoveredPiece === "ownership"
                          ? "animate-pulse-strong"
                          : ""
                      }`}
                      onMouseEnter={() => setHoveredPiece("ownership")}
                      onMouseLeave={() => setHoveredPiece(null)}
                      aria-label="Ownership puzzle piece"
                      role="button"
                      tabIndex={0}
                    />

                    {/* Top Right - SECURITY */}
                    <div
                      className={`absolute top-[15%] right-[15%] w-[30%] h-[30%] z-10 cursor-pointer transition-all duration-300 hover:scale-110 ${
                        hoveredPiece === "security"
                          ? "animate-pulse-strong"
                          : ""
                      }`}
                      onMouseEnter={() => setHoveredPiece("security")}
                      onMouseLeave={() => setHoveredPiece(null)}
                      aria-label="Security puzzle piece"
                      role="button"
                      tabIndex={0}
                    />

                    {/* Bottom Left - DECENTRALIZATION */}
                    <div
                      className={`absolute bottom-[15%] left-[15%] w-[30%] h-[30%] z-10 cursor-pointer transition-all duration-300 hover:scale-110 ${
                        hoveredPiece === "decentralization"
                          ? "animate-pulse-strong"
                          : ""
                      }`}
                      onMouseEnter={() => setHoveredPiece("decentralization")}
                      onMouseLeave={() => setHoveredPiece(null)}
                      aria-label="Decentralization puzzle piece"
                      role="button"
                      tabIndex={0}
                    />

                    {/* Bottom Right - COMPLIANCE */}
                    <div
                      className={`absolute bottom-[15%] right-[15%] w-[30%] h-[30%] z-10 cursor-pointer transition-all duration-300 hover:scale-110 ${
                        hoveredPiece === "compliance"
                          ? "animate-pulse-strong"
                          : ""
                      }`}
                      onMouseEnter={() => setHoveredPiece("compliance")}
                      onMouseLeave={() => setHoveredPiece(null)}
                      aria-label="Compliance puzzle piece"
                      role="button"
                      tabIndex={0}
                    />
                  </div>
                </AspectRatio>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes pulse-light {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes pulse-strong {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.85;
            transform: scale(1.05);
          }
        }

        .animate-pulse-light {
          animation: pulse-light 2s ease-in-out infinite;
        }

        .animate-pulse-strong {
          animation: pulse-strong 1.5s ease-in-out infinite;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes float-infinite {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-5px) rotate(0.5deg);
          }
          50% {
            transform: translateY(0) rotate(0deg);
          }
          75% {
            transform: translateY(5px) rotate(-0.5deg);
          }
          100% {
            transform: translateY(0) rotate(0deg);
          }
        }

        .animate-float-infinite {
          animation: float-infinite 8s ease-in-out infinite;
        }

        @media (prefers-color-scheme: dark) {
          .animate-pulse-light {
            animation: pulse-light 2s ease-in-out infinite;
            filter: brightness(1.2);
          }

          .animate-pulse-strong {
            animation: pulse-strong 1.5s ease-in-out infinite;
            filter: brightness(1.3);
          }
        }

        /* Particle Animation Styles */
        .particle {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: rgba(67, 130, 189, 0.4);
          pointer-events: none;
          transition: all 0.3s ease;
        }

        .particle-1 {
          top: 25%;
          left: 20%;
          animation: smooth-bounce 8s infinite cubic-bezier(0.4, 0, 0.2, 1) 0.1s;
          background-color: rgba(233, 102, 30, 0.4);
        }

        .particle-2 {
          top: 15%;
          right: 25%;
          animation: smooth-bounce 7.5s infinite cubic-bezier(0.4, 0, 0.2, 1)
            0.3s;
          background-color: rgba(67, 130, 189, 0.4);
        }

        .particle-3 {
          bottom: 20%;
          left: 28%;
          animation: smooth-bounce 9s infinite cubic-bezier(0.4, 0, 0.2, 1) 0.5s;
          background-color: rgba(245, 189, 40, 0.4);
        }

        .particle-4 {
          bottom: 25%;
          right: 20%;
          animation: smooth-bounce 8.2s infinite cubic-bezier(0.4, 0, 0.2, 1)
            0.7s;
          background-color: rgba(233, 102, 30, 0.4);
        }

        .particle-5 {
          top: 40%;
          left: 15%;
          width: 4px;
          height: 4px;
          animation: smooth-bounce-x 10s infinite cubic-bezier(0.4, 0, 0.2, 1)
            0.2s;
          background-color: rgba(67, 130, 189, 0.3);
        }

        .particle-6 {
          top: 35%;
          right: 15%;
          width: 4px;
          height: 4px;
          animation: smooth-bounce-x 9.5s infinite cubic-bezier(0.4, 0, 0.2, 1)
            0.4s;
          background-color: rgba(245, 189, 40, 0.3);
        }

        .particle-7 {
          bottom: 45%;
          left: 12%;
          width: 5px;
          height: 5px;
          animation: smooth-bounce-diagonal 11s infinite
            cubic-bezier(0.4, 0, 0.2, 1) 0.6s;
          background-color: rgba(233, 102, 30, 0.35);
        }

        .particle-8 {
          bottom: 40%;
          right: 12%;
          width: 5px;
          height: 5px;
          animation: smooth-bounce-diagonal 10.5s infinite
            cubic-bezier(0.4, 0, 0.2, 1) 0.8s;
          background-color: rgba(67, 130, 189, 0.35);
        }

        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        @keyframes smooth-bounce {
          0% {
            transform: translateY(0);
          }
          25% {
            transform: translateY(-15px);
          }
          50% {
            transform: translateY(0);
          }
          75% {
            transform: translateY(15px);
          }
          100% {
            transform: translateY(0);
          }
        }

        @keyframes smooth-bounce-x {
          0% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-15px);
          }
          50% {
            transform: translateX(0);
          }
          75% {
            transform: translateX(15px);
          }
          100% {
            transform: translateX(0);
          }
        }

        @keyframes smooth-bounce-diagonal {
          0% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(-10px, -10px);
          }
          50% {
            transform: translate(0, 0);
          }
          75% {
            transform: translate(10px, 10px);
          }
          100% {
            transform: translate(0, 0);
          }
        }

        /* Hover effects for the entire puzzle when a piece is hovered */
        .group:hover .particle {
          animation-duration: 6s;
          width: 8px;
          height: 8px;
        }

        /* Dark mode adjustments */
        @media (prefers-color-scheme: dark) {
          .particle {
            filter: brightness(1.5);
          }
          .animate-float-infinite {
            filter: brightness(1.1)
              drop-shadow(0 0 8px rgba(255, 255, 255, 0.1));
          }
        }
      `}</style>
    </section>
  );
}
