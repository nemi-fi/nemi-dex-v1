"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { motion, useAnimationControls, type Variants } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useEffect, useState, useCallback } from "react";

export default function FeaturedByAztec() {
  const { resolvedTheme } = useTheme();
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });
  const [isVisible, setIsVisible] = useState(false);
  const controls = useAnimationControls();

  useEffect(() => {
    if (inView) {
      setIsVisible(true);
      controls.start("visible");
    }
  }, [inView, controls]);

  // Animation variants with enhanced effects
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.9,
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const logoVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.2,
      },
    },
    hover: {
      scale: 1.04,
      filter: "brightness(1.08)",
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const handleLogoMouseEnter = useCallback(() => {
    controls.start("glow");
  }, [controls]);

  const handleLogoMouseLeave = useCallback(() => {
    controls.start("visible");
  }, [controls]);

  return (
    <section
      id="featured-by-aztec"
      ref={ref}
      className="w-full pb-8 dark:bg-black light:bg-white relative overflow-hidden"
      aria-labelledby="featured-heading"
    >
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <motion.h2
              id="featured-heading"
              initial={{ opacity: 0, y: 15 }}
              animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
              transition={{
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.1,
              }}
              className="text-4xl md:text-5xl font-bold mb-4 text-black dark:text-white"
            >
              Powered By
            </motion.h2>
          </div>

          <motion.div
            className="flex flex-col items-center text-center space-y-10 relative"
            initial="hidden"
            animate={controls}
            variants={containerVariants}
          >
            <motion.div
              className="relative py-5 group"
              variants={logoVariants}
              whileHover="hover"
              onMouseEnter={handleLogoMouseEnter}
              onMouseLeave={handleLogoMouseLeave}
            >
              <div className="relative w-full max-w-[280px] transform transition-transform duration-300 group-hover:scale-105">
                <Link
                  href="https://aztec.network"
                  target="_blank"
                  aria-label="Learn more about Aztec Network"
                  className="inline-block"
                >
                  {resolvedTheme === "dark" ? (
                    <Image
                      src="/images/aztec/aztec-logo-light.svg"
                      alt="Aztec Logo"
                      width={90}
                      height={30}
                      className="w-full h-auto object-contain transition-all duration-300"
                      style={{ aspectRatio: "3/1" }}
                    />
                  ) : (
                    <Image
                      src="/images/aztec/aztec-logo-dark.svg"
                      alt="Aztec Logo"
                      width={90}
                      height={30}
                      className="w-full h-auto object-contain transition-all duration-300"
                      style={{ aspectRatio: "3/1" }}
                    />
                  )}
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
