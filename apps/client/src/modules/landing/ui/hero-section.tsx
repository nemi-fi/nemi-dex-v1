"use client";

import { Button } from "@/components/ui/button";
import { sutils } from "@nemi-fi/utils";
import { Shield, ShieldAlert } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";

type Swap = {
  from: string;
  amount1: string;
  amount2: string;
};

type PuzzlePiece = {
  src: string;
  alt: string;
  size: number;
  position: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  rotation: number;
  opacity: number;
  animationDuration: number;
  transform?: string;
  animationName: string;
};

const swaps: Swap[] = [
  { from: "vitalik.eth", amount1: "1 ETH", amount2: "4000 USDC" },
  { from: "Coinbase", amount1: "50 BTC", amount2: "1250 ETH" },
  { from: "You", amount1: "1000 DAI", amount2: "0.01 BTC" },
];

export default function HeroSection() {
  const cardRef = useRef<HTMLDivElement>(null);
  const transactionsAreaRef = useRef<HTMLDivElement>(null);
  const [shieldPercentage, setShieldPercentage] = useState(0);
  const shieldPercentageRef = useRef(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isHorizontalRef = useRef<boolean>(false);
  const animationRef = useRef<number | null>(null);
  const isInteractingRef = useRef(false);
  const { ref: inViewRef, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  const [puzzlePieces, setPuzzlePieces] = useState<PuzzlePiece[]>([]);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const resumeAutoAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRafTimeRef = useRef(0);
  const rafCallbackQueueRef = useRef<Function[]>([]);
  const animationCompletedRef = useRef(false);

  // Determine if dark mode based on theme
  const isDarkMode = mounted ? theme === "dark" : true;

  // Add a smooth transition state - use a ref to reduce rerenders
  const isTransitioningRef = useRef(false);
  const transitionTargetRef = useRef(0); // Default start position
  const lastInteractionTimeRef = useRef(0);

  // Optimized RAF util to batch multiple callbacks
  const scheduleRaf = (callback: Function) => {
    if (rafCallbackQueueRef.current.length === 0) {
      requestAnimationFrame((timestamp) => {
        lastRafTimeRef.current = timestamp;
        const callbacks = [...rafCallbackQueueRef.current];
        rafCallbackQueueRef.current = [];
        callbacks.forEach((cb) => cb(timestamp));
      });
    }
    rafCallbackQueueRef.current.push(callback);
  };

  // Optimize the idle animation to move in one direction and stop at 100%
  const startIdleAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Don't restart if already completed
    if (animationCompletedRef.current) {
      return;
    }

    let prevTimestamp = 0;
    // Consistent speed for all moving elements - make faster
    const speed = 0.5; // Much faster for better demonstration

    const animate = (timestamp: number) => {
      if (isInteractingRef.current) return;

      // Limit framerate for better performance
      if (timestamp - prevTimestamp < 16.67) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      prevTimestamp = timestamp;

      // Get current position
      let position = shieldPercentageRef.current;

      if (isTransitioningRef.current) {
        // Simple transition logic - move towards target
        const target = transitionTargetRef.current;
        const diff = target - position;
        const step = diff * 0.1; // Simple easing

        if (Math.abs(diff) < 0.5) {
          position = target;
          isTransitioningRef.current = false;
        } else {
          position += step;
        }
      } else {
        // Move only left to right (increasing percentage)
        position += speed;

        // Stop at the end without restarting
        if (position >= 100) {
          position = 100;
          animationCompletedRef.current = true;
        }
      }

      // Update ref without triggering rerenders
      shieldPercentageRef.current = position;

      // Update state more frequently for smoother animation
      // Only throttle slightly to ensure visual elements move together
      if (Math.abs(position - shieldPercentage) > 0.5) {
        scheduleRaf(() => {
          setShieldPercentage(position);
        });
      }

      // Continue animation unless we've reached 100%
      if (position < 100) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const stopIdleAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  // More efficient interaction handler with smoother updates
  const handleInteraction = (x: number) => {
    if (!transactionsAreaRef.current) return;

    const rect = transactionsAreaRef.current.getBoundingClientRect();

    // Check bounds
    if (x >= rect.left && x <= rect.right) {
      // Mark as interacting
      isInteractingRef.current = true;
      lastInteractionTimeRef.current = performance.now();

      // Reset animation state
      animationCompletedRef.current = false;

      // Clear any pending animations
      if (resumeAutoAnimationTimeoutRef.current) {
        clearTimeout(resumeAutoAnimationTimeoutRef.current);
        resumeAutoAnimationTimeoutRef.current = null;
      }

      // Calculate percentage
      const relativeX = x - rect.left;
      const newPercentage = Math.max(
        0,
        Math.min(100, (relativeX / rect.width) * 100),
      );

      // Always update ref for smooth movement
      shieldPercentageRef.current = newPercentage;

      // Update immediately for more responsive interaction
      scheduleRaf(() => {
        setShieldPercentage(newPercentage);
      });
    }
  };

  // Simplified transition preparation with better timing
  const prepareForTransition = () => {
    // Clear any existing timeout
    if (resumeAutoAnimationTimeoutRef.current) {
      clearTimeout(resumeAutoAnimationTimeoutRef.current);
    }

    // Choose target position based on current location
    const currentPos = shieldPercentageRef.current;

    // Keep the animation moving in the same direction (toward 100%)
    // unless the user has dragged all the way back close to 0
    const targetPos = currentPos < 5 ? 0 : currentPos;
    transitionTargetRef.current = targetPos;

    // Start transition immediately for faster response
    resumeAutoAnimationTimeoutRef.current = setTimeout(() => {
      isInteractingRef.current = false;
      // Skip transition phase if we're continuing from current position
      isTransitioningRef.current = currentPos < 5;
      animationCompletedRef.current = false; // Reset to allow animation to resume
      startIdleAnimation();
    }, 100); // Much faster response time
  };

  useEffect(() => {
    // Set mounted to true after component mounts
    setMounted(true);

    // Instead of random pieces, create puzzle pieces that match NodeOverlay positions
    const fixedPuzzlePieces: PuzzlePiece[] = [
      // Blue piece - top center position (larger)
      {
        src: "/images/puzzle/blue.svg",
        alt: "Blue Puzzle Piece",
        size: 180,
        position: {
          top: "-8%",
          left: "50%",
        },
        rotation: 0,
        opacity: 0.25,
        animationDuration: 25,
        transform: "translateX(-50%)",
        animationName: "blueFloat",
      },
      // Green piece - top right (medium)
      {
        src: "/images/puzzle/green.svg",
        alt: "Green Puzzle Piece",
        size: 160,
        position: {
          top: "-6%",
          right: "4%",
        },
        rotation: 0,
        opacity: 0.25,
        animationDuration: 28,
        animationName: "float2",
      },
      // Green1 piece - left side (small)
      {
        src: "/images/puzzle/green1.svg",
        alt: "Green Puzzle Piece",
        size: 140,
        position: {
          top: "35%",
          left: "-4%",
        },
        rotation: -10,
        opacity: 0.25,
        animationDuration: 22,
        animationName: "float3",
      },
      // Pink piece - bottom left (medium)
      {
        src: "/images/puzzle/pink.svg",
        alt: "Pink Puzzle Piece",
        size: 150,
        position: {
          bottom: "-4%",
          left: "15%",
        },
        rotation: -5,
        opacity: 0.25,
        animationDuration: 26,
        animationName: "float5",
      },
    ];

    setPuzzlePieces(fixedPuzzlePieces);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (transactionsAreaRef.current) {
        const rect = transactionsAreaRef.current.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          // Inside transaction area - stop auto animation and handle interaction
          isInteractingRef.current = true;
          stopIdleAnimation();
          handleInteraction(e.clientX);
        } else if (isInteractingRef.current) {
          // Just moved outside transaction area - prepare for transition
          prepareForTransition();
        }
      }
    };

    // Simplified transition preparation with better timing
    const prepareForTransition = () => {
      // Clear any existing timeout
      if (resumeAutoAnimationTimeoutRef.current) {
        clearTimeout(resumeAutoAnimationTimeoutRef.current);
      }

      // Choose target position based on current location
      const currentPos = shieldPercentageRef.current;

      // Keep the animation moving in the same direction (toward 100%)
      // unless the user has dragged all the way back close to 0
      const targetPos = currentPos < 5 ? 0 : currentPos;
      transitionTargetRef.current = targetPos;

      // Start transition immediately for faster response
      resumeAutoAnimationTimeoutRef.current = setTimeout(() => {
        isInteractingRef.current = false;
        // Skip transition phase if we're continuing from current position
        isTransitioningRef.current = currentPos < 5;
        animationCompletedRef.current = false; // Reset to allow animation to resume
        startIdleAnimation();
      }, 100); // Much faster response time
    };

    // Optimized touch handlers
    const handleTouchStart = (e: TouchEvent) => {
      if (!e.touches?.[0] || !transactionsAreaRef.current) return;

      const touch = e.touches[0];
      const rect = transactionsAreaRef.current.getBoundingClientRect();

      if (
        touch.clientX >= rect.left &&
        touch.clientX <= rect.right &&
        touch.clientY >= rect.top &&
        touch.clientY <= rect.bottom
      ) {
        isInteractingRef.current = true;
        stopIdleAnimation();
        touchStartXRef.current = touch.clientX;
        touchStartYRef.current = touch.clientY;
        isHorizontalRef.current = false;

        // Handle the initial touch position immediately
        handleInteraction(touch.clientX);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (
        !e.touches?.[0] ||
        e.touches.length === 0 ||
        touchStartXRef.current === null ||
        touchStartYRef.current === null ||
        !transactionsAreaRef.current
      ) {
        return;
      }

      const touch = e.touches[0];
      const rect = transactionsAreaRef.current.getBoundingClientRect();

      if (
        touch.clientX >= rect.left &&
        touch.clientX <= rect.right &&
        touch.clientY >= rect.top &&
        touch.clientY <= rect.bottom
      ) {
        const deltaX = Math.abs(touch.clientX - touchStartXRef.current);
        const deltaY = Math.abs(touch.clientY - touchStartYRef.current);

        // Determine if movement is primarily horizontal with reduced threshold
        if (!isHorizontalRef.current && (deltaX > 3 || deltaY > 3)) {
          isHorizontalRef.current = deltaX > deltaY;
        }

        if (isHorizontalRef.current) {
          e.preventDefault();
          handleInteraction(touch.clientX);
        }
      }
    };

    const handleTouchEnd = () => {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      isHorizontalRef.current = false;

      // Use the same transition logic for touch end
      if (isInteractingRef.current) {
        prepareForTransition();
      }
    };

    // Only add event listeners to the transactions area element, not the whole card
    const transactionsArea = transactionsAreaRef.current;
    if (transactionsArea) {
      // Use passive event listeners where possible for better performance
      transactionsArea.addEventListener("mousemove", handleMouseMove, {
        passive: true,
      });
      transactionsArea.addEventListener("mouseleave", prepareForTransition, {
        passive: true,
      });
      transactionsArea.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });
      transactionsArea.addEventListener("touchmove", handleTouchMove, {
        passive: false, // Need to call preventDefault
      });
      transactionsArea.addEventListener("touchend", handleTouchEnd, {
        passive: true,
      });
    }

    // Start the animation initially
    startIdleAnimation();

    return () => {
      if (transactionsArea) {
        transactionsArea.removeEventListener("mousemove", handleMouseMove);
        transactionsArea.removeEventListener(
          "mouseleave",
          prepareForTransition,
        );
        transactionsArea.removeEventListener("touchstart", handleTouchStart);
        transactionsArea.removeEventListener("touchmove", handleTouchMove);
        transactionsArea.removeEventListener("touchend", handleTouchEnd);
      }
      stopIdleAnimation();
      if (resumeAutoAnimationTimeoutRef.current) {
        clearTimeout(resumeAutoAnimationTimeoutRef.current);
      }
    };
  }, []);

  return (
    <section
      className={`py-4 sm:py-8 md:py-12 lg:py-16 relative overflow-hidden min-h-[100vh] max-h-none w-full flex flex-col items-center justify-center ${
        isDarkMode ? "text-white" : "text-black"
      }`}
      aria-labelledby="hero-heading"
    >
      {/* Dynamic background with optimized rendering */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none overflow-hidden composite-layer">
        <div
          className={`absolute inset-0 ${
            isDarkMode
              ? "bg-[radial-gradient(#ffffff0d_1px,transparent_1px)]"
              : "bg-[radial-gradient(#0000000d_1px,transparent_1px)]"
          } bg-[size:25px_25px] opacity-30 composite-layer`}
          style={{
            WebkitBackfaceVisibility: "hidden",
            backfaceVisibility: "hidden",
          }}
        />
        {/* Optimized puzzle pieces */}
        {mounted &&
          puzzlePieces.map((piece, index) => (
            <div
              key={index}
              className="absolute z-0 safari-fix"
              style={{
                ...piece.position,
                transform: piece.transform
                  ? `${piece.transform} rotate(${piece.rotation}deg) translateZ(0)`
                  : `rotate(${piece.rotation}deg) translateZ(0)`,
                WebkitTransform: piece.transform
                  ? `${piece.transform} rotate(${piece.rotation}deg) translateZ(0)`
                  : `rotate(${piece.rotation}deg) translateZ(0)`,
                opacity: piece.opacity,
                willChange: "transform",
                animation: `${piece.animationName} ${piece.animationDuration}s var(--animation-timing) infinite`,
                WebkitAnimation: `${piece.animationName} ${piece.animationDuration}s var(--animation-timing) infinite`,
                filter: "blur(0.5px)",
                WebkitFilter: "blur(0.5px)",
              }}
            >
              <Image
                src={piece.src}
                width={piece.size}
                height={piece.size}
                alt={piece.alt}
                quality={90}
                style={{
                  maxWidth: "none",
                  WebkitBackfaceVisibility: "hidden",
                  backfaceVisibility: "hidden",
                }}
                className="composite-layer"
              />
            </div>
          ))}
      </div>

      {/* Title section with improved animation and alignment */}
      <div
        className={`w-full max-w-3xl mx-auto z-10 text-center mb-4 sm:mb-6 md:mb-8 transition-all duration-700 ${
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
        ref={inViewRef}
      >
        <h1
          id="hero-heading"
          className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 ${
            isDarkMode ? "text-white" : "text-black"
          } leading-tight tracking-tight`}
        >
          Private DEX
        </h1>
        <p
          className={`text-xs sm:text-sm md:text-base lg:text-lg max-w-2xl mx-auto px-4 sm:px-6 ${
            isDarkMode ? "text-white/85" : "text-black/85"
          } leading-relaxed`}
        >
          Nemi is a revolutionary DEX, protecting traders from strategy leaks,
          copy trading, and doxxing while unlocking trillions in sidelined
          TradFi capital.
        </p>
      </div>

      {/* Main Card Container - Refined dimensions and spacing */}
      <div
        ref={cardRef}
        className="w-full max-w-3xl mx-auto px-3 sm:px-4 md:px-6 relative z-10 mb-8 sm:mb-12"
      >
        <div className="mx-auto">
          {/* Privacy Demo Card with improved UI */}
          <div
            className={`${
              isDarkMode ? "border-white/10" : "border-black/10"
            } backdrop-blur-md rounded-3xl overflow-hidden border shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)]`}
          >
            {/* Card Header */}
            <div className="p-3 sm:p-4 pb-4 sm:pb-6 md:p-8 md:pb-10">
              <h2
                className={`text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-5 text-center ${
                  isDarkMode ? "text-white" : "text-black"
                }`}
              >
                Privacy In Action
              </h2>
              {/* Interaction hint with improved visibility */}
              <div
                className={`text-center text-xs ${
                  isDarkMode ? "text-white/90" : "text-black/90"
                } font-medium `}
              >
                <span className="animate-pulse">
                  Interact with transactions below
                </span>
              </div>
              {/* Interactive Transaction Area */}
              <div className="relative touch-none select-none mt-4 md:mt-6">
                {/* Transaction content wrapper */}
                <div
                  className="relative w-full rounded-lg bg-opacity-20 backdrop-blur-sm overflow-hidden"
                  ref={transactionsAreaRef}
                  style={{
                    WebkitBackfaceVisibility: "hidden",
                    backfaceVisibility: "hidden",
                  }}
                >
                  {/* Divider with optimized rendering */}
                  <div className="absolute top-0 left-0 bottom-0 h-full w-full overflow-hidden rounded-lg">
                    {/* Left side with blur effect that stops at divider */}
                    <div
                      className={`h-full absolute ${
                        isDarkMode
                          ? "bg-gradient-to-r from-black/30 to-transparent"
                          : "bg-gradient-to-r from-white/30 to-transparent"
                      } rounded-lg backdrop-blur-md transition-all duration-200 ease-out`}
                      style={{
                        width: `${shieldPercentage}%`,
                        transform: `translateZ(0)`,
                        WebkitTransform: `translateZ(0)`,
                        // boxShadow: "0 0 20px rgba(0,0,0,0.1)",
                        willChange: "transform, width",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        clipPath: "inset(0)", // Ensure blur effect is contained
                        WebkitClipPath: "inset(0)",
                      }}
                    />
                    {/* White divider line - improved rendering */}
                    <div
                      className={`absolute top-0 bottom-0 ${
                        isDarkMode
                          ? "bg-white/80 shadow-[0_0_15px_rgba(255,255,255,0.7)]"
                          : "bg-black/80 shadow-[0_0_15px_rgba(0,0,0,0.7)]"
                      } transition-all duration-200 ease-out z-40`}
                      style={{
                        left: `${shieldPercentage}%`,
                        transform: `translateZ(0)`,
                        WebkitTransform: `translateZ(0)`,
                        width: "2px", // Make line thicker
                        willChange: "left",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                      }}
                    />
                    {/* Right side with no blur */}
                    <div
                      className="h-full absolute right-0 top-0 transition-all duration-200 ease-out"
                      style={{
                        width: `${100 - shieldPercentage}%`,
                        left: `${shieldPercentage}%`,
                        willChange: "left, width",
                        transform: "translateZ(0)",
                        WebkitTransform: "translateZ(0)",
                      }}
                    />

                    {/* Private indicator - properly aligned */}
                    <div
                      className="m-2 absolute top-0 text-[10px] sm:text-xs md:text-sm font-medium tracking-wider uppercase rounded-full flex items-center transition-all duration-200 ease-out z-50 bg-green-600 text-white shadow-sm"
                      style={{
                        left: `${shieldPercentage}%`,
                        transform: `translateX(-100%) translateZ(0)`,
                        WebkitTransform: `translateX(-100%) translateZ(0)`,
                        opacity: shieldPercentage > 3 ? 1 : 0,
                        willChange: "opacity, left",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        marginLeft: "-12px", // Shift slightly to remove gap with divider
                      }}
                    >
                      <div className="flex px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 items-center gap-1 sm:gap-2">
                        <Shield size={12} className="shrink-0" />
                        <span>Private</span>
                      </div>
                    </div>

                    {/* Exposed indicator - properly aligned */}
                    <div
                      className="m-2 absolute top-0 text-[10px] sm:text-xs md:text-sm font-medium tracking-wider uppercase rounded-full flex items-center transition-all duration-200 ease-out z-50 bg-red-500 text-white shadow-sm"
                      style={{
                        left: `${shieldPercentage}%`,
                        transform: `translateX(0) translateZ(0)`,
                        WebkitTransform: `translateX(0) translateZ(0)`,
                        opacity: shieldPercentage < 97 ? 1 : 0,
                        willChange: "opacity, left",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        marginLeft: "12px", // Shift slightly to remove gap with divider
                      }}
                    >
                      <div className="flex px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 items-center gap-1 sm:gap-2">
                        <ShieldAlert size={12} className="shrink-0" />
                        <span>Exposed</span>
                      </div>
                    </div>
                  </div>

                  {/* Transaction list with optimized rendering */}
                  <div className="pt-6 sm:pt-8 p-3 sm:p-4 space-y-2 relative">
                    {/* Optimized transaction items */}
                    {swaps.map((swap, index) => (
                      <div key={index} className="relative w-full">
                        {/* Shielded side with improved rendering */}
                        <div
                          className="absolute top-0 left-0 w-full h-full overflow-hidden transition-all duration-200 ease-out"
                          style={{
                            clipPath: `inset(0 ${100 - shieldPercentage}% 0 0)`,
                            WebkitClipPath: `inset(0 ${100 - shieldPercentage}% 0 0)`,
                            transform: "translateZ(0)",
                            WebkitTransform: "translateZ(0)",
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            perspective: "1000",
                            WebkitPerspective: "1000",
                            willChange: "clip-path, -webkit-clip-path",
                          }}
                        >
                          <div
                            className={`backdrop-blur-sm rounded-full py-1.5 sm:py-2 px-3 sm:px-4 md:py-3 md:px-6 ${
                              isDarkMode
                                ? "bg-slate-800/40 text-white"
                                : "bg-slate-200/40 text-black"
                            } shadow-inner`}
                            style={{
                              transform: "translateZ(0)",
                              WebkitTransform: "translateZ(0)",
                            }}
                          >
                            <span className="text-xs sm:text-sm md:text-base flex items-center gap-1.5 sm:gap-2">
                              <Shield
                                size={14}
                                className="text-green-400 opacity-70 shrink-0"
                              />
                              <span className="whitespace-nowrap">
                                {"█".repeat(swap.from.length)} swapped{" "}
                                <span
                                  className={`font-medium ${
                                    isDarkMode
                                      ? "text-gray-300"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {"█".repeat(swap.amount1.length)}
                                </span>{" "}
                                for{" "}
                                <span
                                  className={`font-medium ${
                                    isDarkMode
                                      ? "text-gray-300"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {"█".repeat(swap.amount2.length)}
                                </span>
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Unshielded side with improved rendering */}
                        <div
                          className="absolute top-0 left-0 w-full h-full overflow-hidden transition-all duration-200 ease-out"
                          style={{
                            clipPath: `inset(0 0 0 ${shieldPercentage}%)`,
                            WebkitClipPath: `inset(0 0 0 ${shieldPercentage}%)`,
                            transform: "translateZ(0)",
                            WebkitTransform: "translateZ(0)",
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            perspective: "1000",
                            WebkitPerspective: "1000",
                            willChange: "clip-path, -webkit-clip-path",
                          }}
                        >
                          <div
                            className={`backdrop-blur-sm rounded-full py-2 px-4 md:py-3 md:px-6 ${
                              isDarkMode
                                ? "bg-white/15 text-white"
                                : "bg-black/15 text-black"
                            } shadow-lg`}
                            style={{
                              transform: "translateZ(0)",
                              WebkitTransform: "translateZ(0)",
                            }}
                          >
                            <span className="text-sm md:text-base flex items-center gap-2">
                              <ShieldAlert
                                size={16}
                                className="text-red-400 opacity-70 shrink-0"
                              />
                              <span>
                                {swap.from} swapped{" "}
                                <span className="text-[#ea789c] font-medium">
                                  {swap.amount1}
                                </span>{" "}
                                for{" "}
                                <span className="text-[#aca22b] font-medium">
                                  {swap.amount2}
                                </span>
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Invisible item for height */}
                        <div className="invisible">
                          <div className="rounded-full py-2 px-4 md:py-3 md:px-6">
                            <span className="text-sm md:text-base flex items-center gap-2">
                              <Shield size={16} className="shrink-0" />
                              <span>
                                {swap.from} swapped{" "}
                                <span className="font-medium">
                                  {swap.amount1}
                                </span>{" "}
                                for{" "}
                                <span className="font-medium">
                                  {swap.amount2}
                                </span>
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Card Footer with improved design */}
            <div
              className={`${
                isDarkMode
                  ? "bg-black/80 border-white/10"
                  : "bg-gray-100/80 border-black/10"
              } backdrop-blur-md p-4 sm:p-5 md:p-7 flex flex-col items-center justify-center border-t`}
            >
              <p
                className={`text-xs sm:text-sm md:text-base ${
                  isDarkMode ? "text-white/80" : "text-black/80"
                } mb-4 sm:mb-5 font-medium`}
              >
                Nemi protects your transaction privacy automatically
              </p>
              <div className="relative w-full">
                <div className="flex flex-row gap-3 sm:gap-4 justify-center">
                  {/* Telegram CTA Button - Direct link to chat */}
                  <Button
                    asChild
                    className={`flex-1 py-3 sm:py-4 md:py-5 text-xs sm:text-sm md:text-base ${isDarkMode ? "bg-[#0088cc] hover:bg-[#006fa3] text-white" : "bg-[#0088cc] hover:bg-[#006fa3] text-white"} rounded-full font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-300 hover:scale-[1.02] border-0 relative overflow-hidden group shadow-[0_0_6px_rgba(0,136,204,0.4)]`}
                  >
                    <Link
                      href={sutils.appInfo.telegramLink}
                      target="_blank"
                      className="block flex-1"
                    >
                      <div className="flex items-center justify-center">
                        <div
                          className={`absolute inset-0 rounded-full border ${isDarkMode ? "border-white/20" : "border-black/10"}`}
                        ></div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          fill="currentColor"
                          style={{ marginRight: "6px" }}
                          viewBox="0 0 16 16"
                          className="relative z-10 mr-2"
                        >
                          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.287 5.906q-1.168.486-4.666 2.01-.567.225-.595.442c-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294q.39.01.868-.32 3.269-2.206 3.374-2.23c.05-.012.12-.026.166.016s.042.12.037.141c-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8 8 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629q.14.092.27.187c.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.4 1.4 0 0 0-.013-.315.34.34 0 0 0-.114-.217.53.53 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09" />
                        </svg>
                        <span className="relative z-10 tracking-wider">
                          JOIN TELEGRAM
                        </span>
                      </div>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add the keyframes from NodeOverlay.module.css */}
      <style jsx>{`
        /* Add CSS variables for animation control and consistent timing */
        :root {
          --animation-duration: 25s;
          --animation-timing: cubic-bezier(0.4, 0, 0.2, 1);
          --primary-color: ${
            isDarkMode ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)"
          };
          --secondary-color: ${
            isDarkMode ? "rgba(79,70,229,0.5)" : "rgba(0,0,0,0.5)"
          };
          --transition-speed: 300ms;
        }

        /* Optimize animations for performance */
        @keyframes blueFloat {
          0%,
          100% {
            transform: translateX(-50%) translateY(0) translateZ(0);
            -webkit-transform: translateX(-50%) translateY(0) translateZ(0);
            opacity: 0.2;
          }
          50% {
            transform: translateX(-50%) translateY(20px) translateZ(0);
            -webkit-transform: translateX(-50%) translateY(20px) translateZ(0);
            opacity: 0.25;
          }
        }

        @-webkit-keyframes blueFloat {
          0%,
          100% {
            -webkit-transform: translateX(-50%) translateY(0) translateZ(0);
            opacity: 0.2;
          }
          50% {
            -webkit-transform: translateX(-50%) translateY(20px) translateZ(0);
            opacity: 0.25;
          }
        }

        /* Simplify float2 animation */
        @keyframes float2 {
          0%,
          100% {
            transform: translateY(0) translateX(0) translateZ(0);
            opacity: 0.2;
          }
          50% {
            transform: translateY(15px) translateX(-10px) translateZ(0);
            opacity: 0.27;
          }
        }

        @-webkit-keyframes float2 {
          0%,
          100% {
            -webkit-transform: translateY(0) translateX(0) translateZ(0);
            opacity: 0.2;
          }
          50% {
            -webkit-transform: translateY(15px) translateX(-10px) translateZ(0);
            opacity: 0.27;
          }
        }

        /* Simplify float3 animation */
        @keyframes float3 {
          0%,
          100% {
            transform: translateY(0) translateZ(0) rotate(-10deg);
            opacity: 0.22;
          }
          50% {
            transform: translateY(-10px) translateZ(0) rotate(-8deg);
            opacity: 0.27;
          }
        }

        @-webkit-keyframes float3 {
          0%,
          100% {
            -webkit-transform: translateY(0) translateZ(0) rotate(-10deg);
            opacity: 0.22;
          }
          50% {
            -webkit-transform: translateY(-10px) translateZ(0) rotate(-8deg);
            opacity: 0.27;
          }
        }

        /* Simplify float5 animation */
        @keyframes float5 {
          0%,
          100% {
            transform: translate(0, 0) translateZ(0) rotate(-5deg);
            opacity: 0.22;
          }
          50% {
            transform: translate(-10px, -8px) translateZ(0) rotate(-7deg);
            opacity: 0.27;
          }
        }

        @-webkit-keyframes float5 {
          0%,
          100% {
            -webkit-transform: translate(0, 0) translateZ(0) rotate(-5deg);
            opacity: 0.22;
          }
          50% {
            -webkit-transform: translate(-10px, -8px) translateZ(0)
              rotate(-7deg);
            opacity: 0.27;
          }
        }

        /* Optimize pulse animation */
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.6;
            transform: scale(1) translateZ(0);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.05) translateZ(0);
          }
        }

        @-webkit-keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.6;
            -webkit-transform: scale(1) translateZ(0);
          }
          50% {
            opacity: 0.9;
            -webkit-transform: scale(1.05) translateZ(0);
          }
        }

        /* Optimize shine animation */
        @keyframes shine-slow {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        @-webkit-keyframes shine-slow {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        /* Optimize bounce-x animation */
        @keyframes bounce-x {
          0%,
          100% {
            transform: translateX(0) translateZ(0);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: translateX(8px) translateZ(0);
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }

        @-webkit-keyframes bounce-x {
          0%,
          100% {
            -webkit-transform: translateX(0) translateZ(0);
            -webkit-animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            -webkit-transform: translateX(8px) translateZ(0);
            -webkit-animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }

        /* Fast quick-pulse animation */
        @keyframes quick-pulse {
          0%,
          100% {
            transform: scale(1) translateZ(0);
          }
          50% {
            transform: scale(1.08) translateZ(0);
          }
        }

        @-webkit-keyframes quick-pulse {
          0%,
          100% {
            -webkit-transform: scale(1) translateZ(0);
          }
          50% {
            -webkit-transform: scale(1.08) translateZ(0);
          }
        }

        /* Safari-specific optimizations */
        @media not all and (min-resolution: 0.001dpcm) {
          @supports (-webkit-appearance: none) {
            .safari-fix {
              -webkit-transform: translateZ(0);
              transform: translateZ(0);
              -webkit-perspective: 1000;
              perspective: 1000;
              -webkit-backface-visibility: hidden;
              backface-visibility: hidden;
            }

            /* Optimize animations in Safari */
            [class*="animate-"] {
              -webkit-backface-visibility: hidden;
              backface-visibility: hidden;
              -webkit-perspective: 1000;
              perspective: 1000;
              -webkit-transform: translate3d(0, 0, 0);
              transform: translate3d(0, 0, 0);
            }

            /* Fix Safari animation flickering */
            .animation-smoothing {
              -webkit-transform-style: preserve-3d;
              transform-style: preserve-3d;
            }
          }
        }

        /* Performance optimized composite layers */
        .composite-layer {
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
          will-change: transform, opacity;
          z-index: 1;
        }

        /* Animation classes with proper will-change */
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
          -webkit-animation: pulse-slow 4s ease-in-out infinite;
          will-change: transform, opacity;
        }

        .animate-bounce-x {
          animation: bounce-x 1s infinite;
          -webkit-animation: bounce-x 1s infinite;
          will-change: transform;
        }

        .animate-shine-slow {
          animation: shine-slow 8s linear infinite;
          -webkit-animation: shine-slow 8s linear infinite;
          will-change: background-position;
          background-size: 200% 100%;
        }

        .animate-quick-pulse {
          animation: quick-pulse 0.5s ease-in-out;
          -webkit-animation: quick-pulse 0.5s ease-in-out;
          will-change: transform;
        }
      `}</style>
    </section>
  );
}
function getAdjustedBoundingClientRect(element: HTMLElement | null) {
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  const styles = window.getComputedStyle(element);

  const paddingLeft = Number.parseFloat(styles.paddingLeft);
  const paddingRight = Number.parseFloat(styles.paddingRight);
  const paddingTop = Number.parseFloat(styles.paddingTop);
  const paddingBottom = Number.parseFloat(styles.paddingBottom);

  return {
    x: rect.x + paddingLeft,
    y: rect.y + paddingTop,
    top: rect.top + paddingTop,
    left: rect.left + paddingLeft,
    right: rect.right - paddingRight,
    bottom: rect.bottom - paddingBottom,
    width: rect.width - (paddingLeft + paddingRight),
    height: rect.height - (paddingTop + paddingBottom),
  };
}
