"use client";

import { Link } from "react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "#/components/Logo.js";
import { Button } from "#/components/ui/button.js";
import { ArrowLeft, Puzzle } from "lucide-react";
import { HomeNavbar } from "#/modules/home/ui/components/home-navar/index.js";
import { HomeFooter } from "#/modules/home/ui/components/home-footer/index.js";

export default function NotFound() {
  const [hover, setHover] = useState(false);

  // Set page title
  useEffect(() => {
    document.title = "404 - Page Not Found | Nemi";
  }, []);

  // Background puzzle pieces spread across the entire page
  const puzzlePieces = [
    // Left side
    { x: "5%", y: "10%", rotate: -10, delay: 0.2, size: 16 },
    { x: "12%", y: "25%", rotate: 15, delay: 0.3, size: 14 },
    { x: "8%", y: "70%", rotate: 8, delay: 0.4, size: 15 },
    { x: "15%", y: "85%", rotate: -5, delay: 0.5, size: 13 },
    { x: "20%", y: "40%", rotate: 12, delay: 0.6, size: 12 },
    // Right side
    { x: "85%", y: "15%", rotate: -8, delay: 0.7, size: 11 },
    { x: "90%", y: "35%", rotate: 5, delay: 0.8, size: 10 },
    { x: "80%", y: "60%", rotate: -12, delay: 0.9, size: 13 },
    { x: "88%", y: "80%", rotate: 15, delay: 1.0, size: 9 },
    // Top
    { x: "30%", y: "5%", rotate: -15, delay: 1.1, size: 14 },
    { x: "45%", y: "8%", rotate: 10, delay: 1.2, size: 12 },
    { x: "65%", y: "7%", rotate: -5, delay: 1.3, size: 15 },
    // Bottom
    { x: "25%", y: "92%", rotate: 8, delay: 1.4, size: 11 },
    { x: "40%", y: "88%", rotate: -10, delay: 1.5, size: 10 },
    { x: "60%", y: "90%", rotate: 12, delay: 1.6, size: 13 },
    { x: "75%", y: "93%", rotate: -7, delay: 1.7, size: 12 },
    // Middle
    { x: "35%", y: "30%", rotate: 18, delay: 1.8, size: 14 },
    { x: "65%", y: "25%", rotate: -14, delay: 1.9, size: 13 },
    { x: "45%", y: "50%", rotate: 5, delay: 2.0, size: 10 },
    { x: "55%", y: "45%", rotate: -5, delay: 2.1, size: 11 },
    { x: "30%", y: "65%", rotate: 10, delay: 2.2, size: 12 },
    { x: "70%", y: "70%", rotate: -8, delay: 2.3, size: 15 },
    { x: "50%", y: "75%", rotate: 12, delay: 2.4, size: 14 },
  ];

  return (
    <>
      <HomeNavbar />

      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden px-4 py-16 text-foreground md:px-8">
        {/* Puzzle piece background layer */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <AnimatePresence>
            {puzzlePieces.map((piece, index) => (
              <motion.div
                key={index}
                className="absolute z-0"
                style={{
                  left: piece.x,
                  top: piece.y,
                }}
                initial={{
                  x: Math.random() * 200 - 100,
                  y: Math.random() * 200 - 100,
                  rotate: piece.rotate * 3,
                  opacity: 0,
                }}
                animate={{
                  x: 0,
                  y: 0,
                  rotate: piece.rotate,
                  opacity: 0.5,
                }}
                transition={{
                  type: "spring",
                  stiffness: 50,
                  damping: 15,
                  delay: piece.delay,
                }}
                // Continuous subtle movement
                whileInView={{
                  y: ["0%", "-5%", "5%", "0%"],
                  x: ["0%", "3%", "-3%", "0%"],
                  rotate: [
                    piece.rotate,
                    piece.rotate - 5,
                    piece.rotate + 5,
                    piece.rotate,
                  ],
                  transition: {
                    repeat: Infinity,
                    repeatType: "mirror",
                    duration: 10 + (index % 5),
                    ease: "easeInOut",
                  },
                }}
              >
                <div
                  className="flex cursor-pointer items-center justify-center rounded-md bg-primary/5 backdrop-blur-sm shadow-lg transition-all duration-300"
                  style={{
                    height: `${piece.size * 4}px`,
                    width: `${piece.size * 4}px`,
                  }}
                >
                  <Puzzle className="text-primary/30" size={piece.size * 1.5} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Content container (on top of puzzle background) */}
        <div className="relative z-10 flex w-full max-w-xl flex-col items-center justify-center gap-10 backdrop-blur-sm rounded-xl bg-background/20 p-10 shadow-lg text-center">
          {/* Logo with animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mb-6"
            whileHover={{
              rotate: [0, -5, 5, -5, 0],
              transition: { duration: 0.6 },
            }}
          >
            <Logo
              animate={true}
              width={150}
              height={150}
              color="currentColor"
            />
          </motion.div>

          {/* 404 text */}
          <motion.h1
            className="text-9xl font-bold tracking-tighter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            404
          </motion.h1>

          {/* Text with animation */}
          <motion.div
            className="flex flex-col gap-3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: 0.7,
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <h2 className="text-3xl font-medium text-muted-foreground">
              Page not found
            </h2>
            <motion.p
              className="mt-2 text-lg text-muted-foreground"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{
                repeat: Infinity,
                repeatType: "reverse",
                duration: 2,
              }}
            >
              The puzzle pieces you're looking for are scattered...
            </motion.p>
          </motion.div>

          {/* Interactive button with animation */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: 0.9,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-6"
            onHoverStart={() => setHover(true)}
            onHoverEnd={() => setHover(false)}
          >
            <Button
              asChild
              size="lg"
              className="group relative overflow-hidden text-lg px-8 py-6"
            >
              <Link to="/">
                <motion.span
                  className="flex items-center gap-3"
                  whileHover={{ x: -3 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowLeft className="size-5" />
                  <span>Back to home</span>
                </motion.span>

                {/* Button background animation */}
                <AnimatePresence>
                  {hover && (
                    <motion.div
                      className="absolute inset-0 -z-10 bg-primary/20"
                      initial={{ x: "-100%" }}
                      animate={{ x: "0%" }}
                      exit={{ x: "100%" }}
                      transition={{ duration: 0.4 }}
                    />
                  )}
                </AnimatePresence>
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
      <HomeFooter />
    </>
  );
}
