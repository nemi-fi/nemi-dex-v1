import { motion, type Variants } from "framer-motion";
import { type FC, useEffect, useState, useRef } from "react";

interface FullLogoProps {
  width?: number;
  height?: number;
  className?: string;
  animate?: boolean;
  color?: string;
  animationCount?: number;
  loop?: boolean;
}

export const FullLogo: FC<FullLogoProps> = ({
  width = 200,
  height = 58,
  className = "",
  animate = true,
  color = "white",
  animationCount = 1,
  loop = false,
}) => {
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const [animationRuns, setAnimationRuns] = useState(0);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up function to clear all timeouts
  const clearAllTimeouts = () => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }
  };

  // Handle initial animation and subsequent animations
  useEffect(() => {
    // Clear any existing timeouts when dependencies change
    clearAllTimeouts();

    // If animation should run
    if (animate) {
      // If we're looping or haven't reached the count limit
      if (loop || animationRuns < animationCount) {
        // Start animation
        setIsAnimationComplete(false);

        // Set a timeout to complete this animation cycle
        animationTimeoutRef.current = setTimeout(() => {
          setIsAnimationComplete(true);

          // If not looping, increment the counter
          if (!loop) {
            setAnimationRuns((prev) => prev + 1);
          } else {
            // If looping, set a timeout to restart the animation
            loopTimeoutRef.current = setTimeout(() => {
              setIsAnimationComplete(false);
            }, 1000); // Pause between animation cycles
          }
        }, 3000);
      }
    } else {
      // If not animating, reset everything to completed state
      setAnimationRuns(0);
      setIsAnimationComplete(true);
    }

    // Clean up on unmount or when dependencies change
    return clearAllTimeouts;
  }, [animate, animationRuns, animationCount, loop]);

  // Animation variants for the main logo symbol
  const symbolVariants: Variants = {
    hidden: {
      pathLength: 0,
      opacity: 0,
      fill: `rgba(0, 0, 0, 0)`,
    },
    visible: {
      pathLength: 1,
      opacity: 1,
      fill: color,
      transition: {
        pathLength: { duration: 1, ease: [0.43, 0.13, 0.23, 0.96] },
        opacity: { duration: 0.4, ease: "easeInOut" },
        fill: { duration: 0.8, delay: 0.8, ease: [0.43, 0.13, 0.23, 0.96] },
      },
    },
  };

  // Animation variants for the letters
  const letterVariants: Variants = {
    hidden: (custom: number) => ({
      y: custom % 2 === 0 ? 30 : -30,
      x: (custom % 3 === 0 ? -15 : 15) * (custom === 3 ? 0.5 : 1), // Adjust for I letter
      opacity: 0,
      rotateX: custom % 2 === 0 ? 25 : -25,
      rotateY: custom % 2 === 0 ? -15 : 15,
      scale: 0.8,
      fill: `rgba(0, 0, 0, 0)`,
      filter: "blur(8px)",
    }),
    visible: (custom: number) => ({
      y: 0,
      x: 0,
      opacity: 1,
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      fill: color,
      filter: "blur(0px)",
      transition: {
        y: {
          type: "spring",
          stiffness: 80,
          damping: 12,
          delay: 0.7 + custom * 0.12,
        },
        x: {
          type: "spring",
          stiffness: 80,
          damping: 12,
          delay: 0.7 + custom * 0.12,
        },
        opacity: {
          duration: 0.8,
          ease: [0.22, 1, 0.36, 1],
          delay: 0.7 + custom * 0.12,
        },
        rotateX: {
          type: "spring",
          stiffness: 60,
          damping: 10,
          delay: 0.7 + custom * 0.12,
        },
        rotateY: {
          type: "spring",
          stiffness: 60,
          damping: 10,
          delay: 0.7 + custom * 0.12,
        },
        scale: {
          type: "spring",
          stiffness: 100,
          damping: 15,
          delay: 0.7 + custom * 0.12,
        },
        fill: {
          duration: 0.8,
          delay: 0.9 + custom * 0.12,
          ease: [0.22, 1, 0.36, 1],
        },
        filter: {
          duration: 0.8,
          delay: 0.7 + custom * 0.12,
          ease: [0.22, 1, 0.36, 1],
        },
      },
    }),
    wiggle: (custom: number) => ({
      rotateY: [0, custom % 2 === 0 ? 2 : -2, 0],
      rotateX: [0, custom % 2 === 0 ? -1 : 1, 0],
      scale: [1, 1.01, 1],
      filter: [
        `drop-shadow(0 0 2px rgba(0,0,0,0.1))`,
        `drop-shadow(0 0 5px rgba(0,0,0,0.3))`,
        `drop-shadow(0 0 2px rgba(0,0,0,0.1))`,
      ],
      transition: {
        rotateY: {
          repeat: Infinity,
          duration: 6 + custom * 0.7,
          ease: "easeInOut",
          repeatType: "mirror",
          delay: custom * 0.4,
        },
        rotateX: {
          repeat: Infinity,
          duration: 5 + custom * 0.7,
          ease: "easeInOut",
          repeatType: "mirror",
          delay: custom * 0.4 + 0.7,
        },
        scale: {
          repeat: Infinity,
          duration: 4 + custom * 0.7,
          ease: "easeInOut",
          repeatType: "mirror",
          delay: custom * 0.4 + 1.2,
        },
        filter: {
          repeat: Infinity,
          duration: 5 + custom * 0.7,
          ease: "easeInOut",
          repeatType: "mirror",
          delay: custom * 0.4 + 0.9,
        },
      },
    }),
  };

  // Main logo container animation
  const containerVariants: Variants = {
    hidden: {
      scale: 0.9,
      opacity: 0,
      y: 15,
      filter: "blur(5px)",
    },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 80,
        damping: 15,
        mass: 1.2,
        duration: 1,
      },
    },
    hover: {
      scale: 1.03,
      y: -2,
      filter: `drop-shadow(0 0 8px rgba(0,0,0,0.3))`,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 15,
      },
    },
  };

  // Determine if animation should be shown as "hidden" or "visible"
  const shouldAnimate =
    animate &&
    ((loop && !isAnimationComplete) ||
      (animationRuns < animationCount && !isAnimationComplete));
  const initialState = shouldAnimate ? "hidden" : "visible";

  return (
    <motion.div
      style={{
        display: "inline-block",
        perspective: "800px",
        transformStyle: "preserve-3d",
      }}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      whileHover="hover"
    >
      <motion.svg
        width={width}
        height={height}
        viewBox="0 0 879 257"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.2))" }}
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="letterGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={`${color}80`} />
            <stop offset="50%" stopColor={color} />
            <stop offset="100%" stopColor={`${color}80`} />
          </linearGradient>
        </defs>

        {/* Logo symbol */}
        <motion.path
          d="M305.096 128.506H272.983C263.946 128.506 256.676 121.034 256.952 111.932C257.215 103.156 264.873 96.386 273.66 96.386C282.17 96.386 289.064 89.4905 289.064 80.9778V48.193C289.064 39.3166 281.87 32.1203 272.995 32.1203H240.908C232.034 32.1203 224.839 39.3166 224.839 48.193C224.839 57.2323 217.356 64.5164 208.256 64.2281C199.47 63.9522 192.701 56.2795 192.701 47.4909V16.0727C192.701 7.19635 185.506 0 176.632 0H144.545C135.67 0 128.476 7.19635 128.476 16.0727V32.1203C128.476 49.8604 114.099 64.2406 96.3631 64.2406H70.9061C66.6445 64.2406 62.5583 65.9331 59.5501 68.942L4.70033 123.792C1.69212 126.801 0 130.888 0 135.151V176.662C0 185.538 7.19464 192.734 16.0689 192.734H32.1127C49.8737 192.734 64.2504 207.115 64.2504 224.855V240.927C64.2504 249.804 71.4451 257 80.3193 257H112.407C121.281 257 128.476 249.804 128.476 240.927V224.855C128.476 206.6 143.705 191.907 162.143 192.772C179.415 193.587 192.701 208.469 192.701 225.757V240.927C192.701 249.804 199.896 257 208.77 257H240.883C249.757 257 256.952 249.804 256.952 240.927V224.855C256.952 207.115 271.328 192.734 289.064 192.734H305.108C313.982 192.734 321.177 185.538 321.177 176.662V144.566C321.177 135.69 313.982 128.494 305.108 128.494L305.096 128.506ZM64.2379 144.341C55.489 144.341 48.3946 137.245 48.3946 128.494C48.3946 119.743 55.489 112.647 64.2379 112.647C72.9868 112.647 80.0811 119.743 80.0811 128.494C80.0811 137.245 72.9868 144.341 64.2379 144.341Z"
          variants={symbolVariants}
          initial={initialState}
          animate="visible"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: isAnimationComplete ? "url(#glow)" : "none" }}
        />

        {/* The group for all letters with 3D perspective */}
        <g style={{ transformStyle: "preserve-3d" }}>
          {/* Letter N */}
          <motion.path
            d="M408.591 85.9805H433.647C435.627 85.9805 437.457 87.0336 438.447 88.7512L496.142 188.184C498.988 193.086 506.496 191.067 506.496 185.4V91.547C506.496 88.4754 508.977 85.993 512.048 85.993H527.942C531.013 85.993 533.494 88.4754 533.494 91.547V239.285C533.494 242.357 531.013 244.839 527.942 244.839H502.886C500.905 244.839 499.075 243.786 498.085 242.069L440.39 142.636C437.545 137.734 430.037 139.753 430.037 145.419V239.285C430.037 242.357 427.555 244.839 424.484 244.839H408.591C405.52 244.839 403.038 242.357 403.038 239.285V91.547C403.038 88.4754 405.52 85.993 408.591 85.993V85.9805Z"
            custom={0}
            variants={letterVariants}
            initial={initialState}
            animate={["visible", isAnimationComplete ? "wiggle" : ""]}
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transformOrigin: "center", transformStyle: "preserve-3d" }}
          />

          {/* Letter E */}
          <motion.path
            d="M561.734 85.9805H651.14C654.211 85.9805 656.693 88.4628 656.693 91.5344V106.065C656.693 109.137 654.211 111.619 651.14 111.619H588.733C585.662 111.619 583.18 114.101 583.18 117.173V145.783C583.18 148.855 585.662 151.337 588.733 151.337H651.14C654.211 151.337 656.693 153.819 656.693 156.891V171.421C656.693 174.493 654.211 176.975 651.14 176.975H588.733C585.662 176.975 583.18 179.458 583.18 182.529V213.634C583.18 216.706 585.662 219.188 588.733 219.188H651.14C654.211 219.188 656.693 221.671 656.693 224.742V239.285C656.693 242.357 654.211 244.839 651.14 244.839H561.734C558.663 244.839 556.181 242.357 556.181 239.285V91.547C556.181 88.4754 558.663 85.993 561.734 85.993V85.9805Z"
            custom={1}
            variants={letterVariants}
            initial={initialState}
            animate={["visible", isAnimationComplete ? "wiggle" : ""]}
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transformOrigin: "center", transformStyle: "preserve-3d" }}
          />

          {/* Letter M */}
          <motion.path
            d="M678.102 85.9805H709.926C712.383 85.9805 714.539 87.5978 715.241 89.9422L745.724 192.058C747.303 197.348 754.786 197.348 756.365 192.058L786.836 89.9422C787.538 87.5852 789.706 85.9805 792.151 85.9805H823.749C826.82 85.9805 829.302 88.4628 829.302 91.5344V239.273C829.302 242.344 826.82 244.827 823.749 244.827H807.856C804.785 244.827 802.303 242.344 802.303 239.273V165.516C802.303 159.122 793.279 157.794 791.436 163.924L768.323 240.878C767.621 243.222 765.453 244.827 763.008 244.827H739.695C737.263 244.827 735.107 243.235 734.393 240.915L710.377 162.984C708.497 156.891 699.523 158.245 699.523 164.614V239.273C699.523 242.344 697.041 244.827 693.97 244.827H678.077C675.006 244.827 672.524 242.344 672.524 239.273V91.5344C672.524 88.4628 675.006 85.9805 678.077 85.9805H678.102Z"
            custom={2}
            variants={letterVariants}
            initial={initialState}
            animate={["visible", isAnimationComplete ? "wiggle" : ""]}
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transformOrigin: "center", transformStyle: "preserve-3d" }}
          />

          {/* Letter I */}
          <motion.path
            d="M857.554 85.9805H873.448C876.518 85.9805 879 88.4628 879 91.5344V239.273C879 242.344 876.518 244.827 873.448 244.827H857.554C854.483 244.827 852.001 242.344 852.001 239.273V91.5344C852.001 88.4628 854.483 85.9805 857.554 85.9805Z"
            custom={3}
            variants={letterVariants}
            initial={initialState}
            animate={["visible", isAnimationComplete ? "wiggle" : ""]}
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transformOrigin: "center", transformStyle: "preserve-3d" }}
          />
        </g>
      </motion.svg>
    </motion.div>
  );
};

// Logo component for icon version
interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  animate?: boolean;
  color?: string;
}

export const Logo: FC<LogoProps> = ({
  width = 28,
  height = 28,
  className = "",
  animate = true,
  color = "white",
}) => {
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => {
        setIsAnimationComplete(true);
      }, 1600); // Reduced from 6000ms to 2000ms
      return () => clearTimeout(timer);
    }
  }, [animate]);

  // For persistent filled state
  useEffect(() => {
    // Save state when animation completes
    if (isAnimationComplete) {
      // We just need to ensure it stays filled white
      // No need to persist in localStorage for this case
    }
  }, [isAnimationComplete]);

  // Main path to be animated in sections
  const mainPathVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  // Sections of the logo to animate sequentially
  const section1Variants: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
        opacity: { duration: 0.3, ease: "easeInOut" },
      },
    },
  };

  const section2Variants: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 },
        opacity: { duration: 0.3, ease: "easeInOut", delay: 0.2 },
      },
    },
  };

  const section3Variants: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.4 },
        opacity: { duration: 0.3, ease: "easeInOut", delay: 0.4 },
      },
    },
  };

  const fillVariants: Variants = {
    hidden: {
      fill: "rgba(255, 255, 255, 0)",
      filter: "blur(5px)",
      opacity: 0,
    },
    visible: {
      fill: color,
      filter: "blur(0px)",
      opacity: 1,
      transition: {
        fill: { duration: 0.8, delay: 1, ease: [0.16, 1, 0.3, 1] },
        filter: { duration: 0.5, delay: 1.2, ease: "easeOut" },
        opacity: { duration: 0.7, delay: 1, ease: "easeInOut" },
      },
    },
  };

  const logoVariants: Variants = {
    initial: {
      scale: 0.95,
      opacity: 0,
      y: 10,
      rotateX: 10,
      rotateY: -10,
    },
    animate: {
      scale: 1,
      opacity: 1,
      y: 0,
      rotateX: 0,
      rotateY: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
        mass: 1,
        duration: 1.5,
      },
    },
    hover: {
      scale: 1.05,
      rotateY: 5,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15,
      },
    },
    // Final filled state that doesn't animate
    filledState: {
      scale: 1,
      opacity: 1,
      y: 0,
      rotateX: 0,
      rotateY: 0,
    },
    // Only used during the animated sequence
    idle: {
      y: [0, -2, 0],
      rotateY: [0, 2, 0],
      rotateX: [0, 1, 0],
      transition: {
        y: {
          repeat: Infinity,
          repeatType: "mirror" as const,
          duration: 4,
          ease: "easeInOut",
        },
        rotateY: {
          repeat: Infinity,
          repeatType: "mirror" as const,
          duration: 5,
          ease: "easeInOut",
        },
        rotateX: {
          repeat: Infinity,
          repeatType: "mirror" as const,
          duration: 6,
          ease: "easeInOut",
        },
      },
    },
  };

  return (
    <motion.div
      style={{
        perspective: "400px",
        transformStyle: "preserve-3d",
        display: "inline-block",
      }}
      initial="initial"
      animate={isAnimationComplete ? "filledState" : "animate"}
      variants={logoVariants}
      whileHover="hover"
    >
      <motion.svg
        width={width}
        height={height}
        viewBox="0 0 392 313"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.2))" }}
        variants={logoVariants}
      >
        <g>
          {/* Base shape with fill transition - always present after animation */}
          <motion.path
            d="M372.372 156.508H333.179C322.149 156.508 313.276 147.407 313.612 136.322C313.934 125.634 323.281 117.388 334.005 117.388C344.392 117.388 352.806 108.99 352.806 98.6227V58.6942C352.806 47.8837 344.025 39.1193 333.194 39.1193H294.031C283.2 39.1193 274.418 47.8837 274.418 58.6942C274.418 69.7032 265.285 78.5745 254.179 78.2233C243.455 77.8874 235.194 68.5427 235.194 57.8391V19.5749C235.194 8.76443 226.413 0 215.582 0H176.418C165.587 0 156.806 8.76443 156.806 19.5749V39.1193C156.806 60.725 139.259 78.2385 117.612 78.2385H86.5417C81.3403 78.2385 76.3531 80.2999 72.6815 83.9644L5.73681 150.766C2.06525 154.431 0 159.409 0 164.6V215.156C0 225.966 8.78114 234.731 19.6122 234.731H39.1939C60.8714 234.731 78.4184 252.245 78.4184 273.85V293.425C78.4184 304.236 87.1995 313 98.0306 313H137.194C148.025 313 156.806 304.236 156.806 293.425V273.85C156.806 251.618 175.393 233.723 197.897 234.777C218.978 235.769 235.194 253.894 235.194 274.95V293.425C235.194 304.236 243.975 313 254.806 313H294C304.831 313 313.612 304.236 313.612 293.425V273.85C313.612 252.245 331.159 234.731 352.806 234.731H372.388C383.219 234.731 392 225.966 392 215.156V176.067C392 165.257 383.219 156.492 372.388 156.492L372.372 156.508ZM78.4031 175.792C67.725 175.792 59.0662 167.15 59.0662 156.492C59.0662 145.835 67.725 137.192 78.4031 137.192C89.0812 137.192 97.7399 145.835 97.7399 156.492C97.7399 167.15 89.0812 175.792 78.4031 175.792Z"
            variants={fillVariants}
            initial={animate ? "hidden" : "visible"}
            animate="visible"
            fill={!animate ? color : undefined}
          />

          {/* Only show the section animations during initial animation */}
          {animate && !isAnimationComplete && (
            <>
              {/* Section 1: Top part */}
              <motion.path
                d="M215.582 0H176.418C165.587 0 156.806 8.76443 156.806 19.5749V39.1193C156.806 60.725 139.259 78.2385 117.612 78.2385H86.5417C81.3403 78.2385 76.3531 80.2999 72.6815 83.9644L5.73681 150.766C2.06525 154.431 0 159.409 0 164.6V215.156C0 225.966 8.78114 234.731 19.6122 234.731H39.1939"
                stroke={color}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="transparent"
                variants={section1Variants}
                initial="hidden"
                animate="visible"
              />

              {/* Section 2: Bottom left */}
              <motion.path
                d="M39.1939 234.731C60.8714 234.731 78.4184 252.245 78.4184 273.85V293.425C78.4184 304.236 87.1995 313 98.0306 313H137.194C148.025 313 156.806 304.236 156.806 293.425V273.85C156.806 251.618 175.393 233.723 197.897 234.777"
                stroke={color}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="transparent"
                variants={section2Variants}
                initial="hidden"
                animate="visible"
              />

              {/* Section 3: Bottom right and top right */}
              <motion.path
                d="M197.897 234.777C218.978 235.769 235.194 253.894 235.194 274.95V293.425C235.194 304.236 243.975 313 254.806 313H294C304.831 313 313.612 304.236 313.612 293.425V273.85C313.612 252.245 331.159 234.731 352.806 234.731H372.388C383.219 234.731 392 225.966 392 215.156V176.067C392 165.257 383.219 156.492 372.388 156.492L372.372 156.508H333.179C322.149 156.508 313.276 147.407 313.612 136.322C313.934 125.634 323.281 117.388 334.005 117.388C344.392 117.388 352.806 108.99 352.806 98.6227V58.6942C352.806 47.8837 344.025 39.1193 333.194 39.1193H294.031C283.2 39.1193 274.418 47.8837 274.418 58.6942C274.418 69.7032 265.285 78.5745 254.179 78.2233C243.455 77.8874 235.194 68.5427 235.194 57.8391V19.5749C235.194 8.76443 226.413 0 215.582 0"
                stroke={color}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="transparent"
                variants={section3Variants}
                initial="hidden"
                animate="visible"
              />

              {/* Circle element (drawn first) */}
              <motion.path
                d="M78.4031 175.792C67.725 175.792 59.0662 167.15 59.0662 156.492C59.0662 145.835 67.725 137.192 78.4031 137.192C89.0812 137.192 97.7399 145.835 97.7399 156.492C97.7399 167.15 89.0812 175.792 78.4031 175.792Z"
                stroke={color}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="transparent"
                variants={section1Variants}
                initial="hidden"
                animate="visible"
              />
            </>
          )}
        </g>
      </motion.svg>
    </motion.div>
  );
};
