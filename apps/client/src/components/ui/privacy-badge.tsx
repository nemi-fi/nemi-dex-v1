import { Shield, Lock, CheckCircle, Info } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";

interface PrivacyBadgeProps {
  variant?: "default" | "subtle" | "outlined" | "glow";
  size?: "xs" | "sm" | "md" | "lg";
  label?: string;
  description?: string;
  className?: string;
  animated?: boolean;
  icon?: "lock" | "shield" | "check" | "info";
  showDetails?: boolean;
}

export function PrivacyBadge({
  variant = "default",
  size = "md",
  label = "Private",
  description = "Your data is securely encrypted",
  className,
  animated = true,
  icon = "lock",
  showDetails = false,
}: PrivacyBadgeProps) {
  const variants = {
    default:
      "bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border-emerald-200 shadow-sm",
    subtle: "bg-emerald-50/80 text-emerald-600 border-emerald-100",
    outlined: "bg-transparent text-emerald-600 border-emerald-300",
    glow: "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
  };

  const sizes = {
    xs: "text-xs py-0.5 px-1 gap-0.5",
    sm: "text-xs py-0.5 px-1.5 gap-0.5",
    md: "text-sm py-1 px-2 gap-1",
    lg: "text-base py-1.5 px-3 gap-1.5",
  };

  const iconSizes = {
    xs: "h-2.5 w-2.5",
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const IconComponent =
    icon === "shield"
      ? Shield
      : icon === "check"
        ? CheckCircle
        : icon === "info"
          ? Info
          : Lock;

  const badgeContent = (
    <div
      className={cn(
        "flex items-center font-medium rounded-full border backdrop-blur-sm",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      <IconComponent className={iconSizes[size]} />
      <span>{label}</span>
      {showDetails && size !== "xs" && size !== "sm" && (
        <span className="ml-1 text-xs opacity-75">{description}</span>
      )}
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 20,
        }}
      >
        {badgeContent}
      </motion.div>
    );
  }

  return badgeContent;
}

// Enhanced version with privacy details panel
export function PrivacyBadgeWithDetails({
  variant = "default",
  label = "Private",
  description = "Your data is securely encrypted",
  className,
  icon = "lock",
  details = [
    "End-to-end encryption",
    "Zero-knowledge proofs",
    "No data sharing",
  ],
}: PrivacyBadgeProps & { details?: string[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-left w-full focus:outline-none"
      >
        <PrivacyBadge
          variant={variant}
          label={label}
          description={description}
          icon={icon}
          size="md"
          animated={true}
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "absolute z-10 mt-1 p-3 rounded-lg border shadow-lg w-64",
              variant === "default"
                ? "bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-800"
                : "",
              variant === "subtle"
                ? "bg-white dark:bg-slate-800 border-emerald-100 dark:border-emerald-900"
                : "",
              variant === "outlined"
                ? "bg-white dark:bg-slate-800 border-emerald-300 dark:border-emerald-700"
                : "",
              variant === "glow"
                ? "bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-800"
                : "",
            )}
          >
            <h4 className="font-medium text-emerald-700 dark:text-emerald-400 mb-2">
              {label}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
              {description}
            </p>
            <ul className="space-y-1.5">
              {details.map((detail, index) => (
                <li
                  key={index}
                  className="flex items-center text-xs text-slate-700 dark:text-slate-300"
                >
                  <CheckCircle className="h-3 w-3 text-emerald-500 mr-1.5 flex-shrink-0" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PrivacyPulse({
  className,
  size = "md",
  color = "emerald",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  color?: "emerald" | "blue" | "purple";
}) {
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4.5 w-4.5",
  };

  const colorVariants = {
    emerald: {
      pulse: "bg-emerald-400",
      bg: "bg-gradient-to-br from-emerald-100 to-emerald-50",
      border: "border-emerald-200",
      icon: "text-emerald-700",
    },
    blue: {
      pulse: "bg-blue-400",
      bg: "bg-gradient-to-br from-blue-100 to-blue-50",
      border: "border-blue-200",
      icon: "text-blue-700",
    },
    purple: {
      pulse: "bg-purple-400",
      bg: "bg-gradient-to-br from-purple-100 to-purple-50",
      border: "border-purple-200",
      icon: "text-purple-700",
    },
  };

  const colorClasses = colorVariants[color];

  return (
    <div className={cn("relative inline-flex", sizeClasses[size], className)}>
      <motion.div
        className={cn(
          "absolute inset-0 rounded-full opacity-30",
          colorClasses.pulse,
        )}
        animate={{
          scale: [1, 1.6, 1],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "loop",
        }}
      />
      <motion.div
        className={cn(
          "absolute inset-0 rounded-full opacity-20",
          colorClasses.pulse,
        )}
        animate={{
          scale: [1, 2, 1],
          opacity: [0.2, 0, 0.2],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          repeatType: "loop",
          delay: 0.2,
        }}
      />
      <div
        className={cn(
          "relative z-10 flex items-center justify-center rounded-full border shadow-sm",
          sizeClasses[size],
          colorClasses.bg,
          colorClasses.border,
        )}
      >
        <motion.div
          animate={{ rotate: [0, 10, 0, -10, 0] }}
          transition={{
            duration: 5,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
          }}
        >
          <Shield className={cn(iconSizes[size], colorClasses.icon)} />
        </motion.div>
      </div>
    </div>
  );
}

// New component for a fancy privacy badge with animations
export function PrivacyFancyBadge({
  label = "Private & Secure",
  description = "End-to-end encrypted",
  className,
  showDescription = true,
}: {
  label?: string;
  description?: string;
  className?: string;
  showDescription?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center backdrop-blur-sm px-3 py-1.5 rounded-full overflow-hidden",
        "border border-emerald-200 shadow-sm",
        className,
      )}
    >
      {/* Background light effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-emerald-50 via-emerald-100 to-emerald-50 opacity-90"
        animate={{
          backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          repeatType: "loop",
          ease: "linear",
        }}
      />

      {/* Animated shimmering effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
        animate={{
          left: ["-100%", "100%"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
        }}
      />

      {/* Icon with animation */}
      <motion.div
        className="relative z-10 mr-2 bg-white/80 p-1 rounded-full"
        animate={{ rotate: [0, 5, 0, -5, 0] }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
        }}
      >
        <Shield className="h-3.5 w-3.5 text-emerald-700" />
      </motion.div>

      {/* Text */}
      <div className="relative z-10">
        <span className="text-sm font-medium text-emerald-700">{label}</span>
        {showDescription && (
          <span className="ml-1 text-xs opacity-75 text-emerald-600">
            {description}
          </span>
        )}
      </div>
    </div>
  );
}
