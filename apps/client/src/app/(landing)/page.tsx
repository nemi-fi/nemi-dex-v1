"use client";

import { HomeNavbar } from "@/modules/home/ui/components/home-navar";
import { TokenProvider } from "@/modules/home/ui/components/swap-section/TokenContext";
import styles from "@/styles/SwapOverlay.module.css";
import Image from "next/image";
import { Suspense, lazy } from "react";

// Lazy load components
const HeroSection = lazy(() => import("@/modules/landing/ui/hero-section"));
const FeatureCards = lazy(
  () => import("@/modules/landing/ui/feature-cards-alt"),
);
const FeatureCardsMobile = lazy(
  () => import("@/modules/landing/ui/feature-cards-mobile"),
);
const DefiPuzzle = lazy(() => import("@/modules/landing/ui/defi-puzzle"));
const BenefitsForTraders = lazy(
  () => import("@/modules/landing/ui/benefits-for-traders"),
);
const FeaturedByAztec = lazy(
  () => import("@/modules/landing/ui/featured-by-aztec"),
);
const Footer = lazy(() => import("@/modules/landing/ui/footer"));
const SwapSection = lazy(() =>
  import("@/modules/home/ui/components/swap-section").then((mod) => ({
    default: mod.SwapSection,
  })),
);

// Skeleton loaders
const HeroSkeleton = () => (
  <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
    <div className="animate-pulse">
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 mb-6"></div>
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-10"></div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-40"></div>
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-40"></div>
      </div>
    </div>
  </div>
);

const FeatureCardsSkeleton = () => (
  <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12">
    <div className="animate-pulse">
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/3 mx-auto mb-10"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6">
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-2/3 mb-3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const BenefitsSkeleton = () => (
  <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-16">
    <div className="animate-pulse">
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2 mx-auto mb-10"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-4 mb-6">
            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SwapSkeleton = () => (
  <div className="w-full max-w-md mx-auto">
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 animate-pulse">
      <div className="flex justify-between mb-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
      <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 mb-2">
        <div className="flex justify-between mb-2">
          <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
        </div>
        <div className="flex items-center">
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-600 rounded-full mr-3"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
        </div>
      </div>
      <div className="flex justify-center my-4">
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
      <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 mb-6">
        <div className="flex justify-between mb-2">
          <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
        </div>
        <div className="flex items-center">
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-600 rounded-full mr-3"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
        </div>
      </div>
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl w-full"></div>
    </div>
  </div>
);

const FooterSkeleton = () => (
  <div className="w-full bg-gray-50 dark:bg-gray-900 py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 animate-pulse">
      <div className="flex flex-col md:flex-row justify-between">
        <div className="mb-8 md:mb-0">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4"></div>
              {[...Array(4)].map((_, j) => (
                <div
                  key={j}
                  className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-3"
                ></div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="h-px bg-gray-200 dark:bg-gray-700 my-8"></div>
      <div className="flex justify-between items-center">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
        <div className="flex space-x-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"
            ></div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Generic skeleton for other components
const GenericSkeleton = () => (
  <div className="w-full py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 animate-pulse">
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto mb-8"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg"
          ></div>
        ))}
      </div>
      <div className="mt-8 h-40 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
    </div>
  </div>
);

export default function LandingInfo() {
  return (
    <div className="flex flex-col min-h-screen dark:bg-black">
      <header role="banner">
        <HomeNavbar />
      </header>
      <main
        className="min-h-screen bg-white dark:bg-black relative overflow-hidden"
        id="main-content"
      >
        {/* Background dots pattern - only for sections after the first one */}
        <div className="absolute inset-0 z-0 top-[700px]">
          <div
            className="w-full h-full opacity-20 dark:opacity-10"
            style={{
              backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
            aria-hidden="true"
          ></div>
        </div>

        <div className="relative">
          {/* Hero Section */}
          <section aria-labelledby="hero-heading">
            <Suspense
              fallback={
                <div className="min-h-[85vh] max-h-screen flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                </div>
              }
            >
              <HeroSection />
            </Suspense>
          </section>

          {/* DeFi Puzzle Section */}
          <section aria-labelledby="defi-puzzle-heading">
            <Suspense fallback={<GenericSkeleton />}>
              <DefiPuzzle />
            </Suspense>
          </section>

          {/* Feature Cards Section - Desktop */}
          <section
            aria-labelledby="features-heading"
            className="hidden md:block"
          >
            <Suspense fallback={<FeatureCardsSkeleton />}>
              <FeatureCards />
            </Suspense>
          </section>

          {/* Feature Cards Section - Mobile */}
          <section aria-label="Features" className="md:hidden">
            <Suspense fallback={<FeatureCardsSkeleton />}>
              <FeatureCardsMobile />
            </Suspense>
          </section>

          <div className="relative">
            {/* Puzzle pieces background */}
            <div
              className="absolute inset-0 w-full h-full overflow-hidden"
              aria-hidden="true"
            >
              <div className={styles.node_one}>
                <Image
                  src="/images/puzzle/blue.svg"
                  width={220}
                  height={220}
                  alt=""
                  priority={false}
                  quality={75}
                  loading="lazy"
                  role="presentation"
                />
              </div>

              <div className={styles.node_two}>
                <Image
                  src="/images/puzzle/green.svg"
                  width={220}
                  height={220}
                  alt=""
                  priority={false}
                  quality={75}
                  loading="lazy"
                  role="presentation"
                />
              </div>

              <div className={styles.node_three}>
                <Image
                  src="/images/puzzle/green1.svg"
                  width={220}
                  height={220}
                  alt=""
                  quality={75}
                  loading="lazy"
                  role="presentation"
                />
              </div>

              <div className={styles.node_four}>
                <Image
                  src="/images/puzzle/orange.svg"
                  width={320}
                  height={320}
                  alt=""
                  quality={75}
                  loading="lazy"
                  role="presentation"
                />
              </div>

              <div className={styles.node_five}>
                <Image
                  src="/images/puzzle/pink.svg"
                  width={220}
                  height={220}
                  alt=""
                  quality={75}
                  loading="lazy"
                  role="presentation"
                />
              </div>

              <div className={styles.node_six}>
                <Image
                  src="/images/puzzle/yellow.svg"
                  width={220}
                  height={220}
                  alt=""
                  quality={75}
                  loading="lazy"
                  role="presentation"
                />
              </div>

              <div className={styles.node_seven}>
                <Image
                  src="/images/puzzle/yellow1.svg"
                  width={140}
                  height={140}
                  alt=""
                  quality={75}
                  loading="lazy"
                  role="presentation"
                />
              </div>
            </div>

            <section
              aria-labelledby="swap-demo-heading"
              className="w-full max-w-xl mx-auto relative overflow-hidden py-20"
            >
              <h2 id="swap-demo-heading" className="sr-only">
                Try Nemi Swap
              </h2>

              <div className="relative z-20">
                <TokenProvider>
                  <Suspense fallback={<SwapSkeleton />}>
                    <SwapSection />
                  </Suspense>
                </TokenProvider>
              </div>
            </section>
          </div>

          {/* Benefits for Traders Section */}
          <section aria-labelledby="benefits-heading">
            <Suspense fallback={<BenefitsSkeleton />}>
              <BenefitsForTraders />
            </Suspense>
          </section>

          <section aria-labelledby="featured-heading">
            <Suspense fallback={<GenericSkeleton />}>
              <FeaturedByAztec />
            </Suspense>
          </section>
        </div>
      </main>
      <Suspense fallback={<FooterSkeleton />}>
        <Footer />
      </Suspense>
    </div>
  );
}
