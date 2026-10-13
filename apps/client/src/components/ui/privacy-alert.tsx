import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCircle, Info, Lock, Shield, X } from "lucide-react";
import { useState } from "react";

interface PrivacyAlertProps {
  variant?: "info" | "success" | "warning" | "primary";
  title?: string;
  description?: string;
  className?: string;
  dismissible?: boolean;
  icon?: React.ReactNode;
  elevated?: boolean;
}

export function PrivacyAlert({
  variant = "info",
  title = "Private Transactions",
  description = "Your address is private and secure.",
  className,
  dismissible = false,
  icon,
  elevated = false,
}: PrivacyAlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const variants = {
    info: {
      bg: "bg-blue-50 dark:bg-blue-950/40",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-800 dark:text-blue-300",
      iconColor: "text-blue-500 dark:text-blue-400",
      hoverBg: "hover:bg-blue-100/50 dark:hover:bg-blue-800/20",
    },
    success: {
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-emerald-200 dark:border-emerald-800",
      text: "text-emerald-800 dark:text-emerald-300",
      iconColor: "text-emerald-500 dark:text-emerald-400",
      hoverBg: "hover:bg-emerald-100/50 dark:hover:bg-emerald-800/20",
    },
    warning: {
      bg: "bg-amber-50 dark:bg-amber-950/40",
      border: "border-amber-200 dark:border-amber-800",
      text: "text-amber-800 dark:text-amber-300",
      iconColor: "text-amber-500 dark:text-amber-400",
      hoverBg: "hover:bg-amber-100/50 dark:hover:bg-amber-800/20",
    },
    primary: {
      bg: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/40",
      border: "border-indigo-200 dark:border-indigo-800",
      text: "text-indigo-800 dark:text-indigo-300",
      iconColor: "text-indigo-500 dark:text-indigo-400",
      hoverBg: "hover:bg-indigo-100/50 dark:hover:bg-indigo-800/20",
    },
  };

  const currentVariant = variants[variant];

  const defaultIcons = {
    info: <Info className="h-5 w-5" />,
    success: <CheckCircle className="h-5 w-5" />,
    warning: <Bell className="h-5 w-5" />,
    primary: <Shield className="h-5 w-5" />,
  };

  const iconToUse = icon || defaultIcons[variant];

  return (
    <div className="px-4 pt-4">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "border rounded-lg relative flex items-start gap-3 backdrop-blur-sm overflow-hidden",
              currentVariant.bg,
              currentVariant.border,
              elevated ? "shadow-md" : "shadow-sm",
              className,
            )}
          >
            {/* Background visual effect for primary variant */}
            {variant === "primary" && (
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
            )}

            <div className="p-3 flex gap-3 relative z-10 w-full">
              <div
                className={cn(
                  "flex align-center flex-shrink-0",
                  currentVariant.iconColor,
                )}
              >
                {iconToUse}
              </div>
              <div className="flex-1">
                <h4 className={cn("font-medium mb-0.5", currentVariant.text)}>
                  {title}
                </h4>
                <p className={cn("text-sm opacity-80", currentVariant.text)}>
                  {description}
                </p>
              </div>
              {dismissible && (
                <button
                  onClick={() => setIsVisible(false)}
                  className={cn(
                    "p-1 rounded-full transition-colors flex-shrink-0",
                    currentVariant.hoverBg,
                  )}
                  aria-label="Dismiss"
                >
                  <X className={cn("h-4 w-4", currentVariant.iconColor)} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PrivacyFeatureAlert({
  feature,
  className,
  icon = "shield",
  color = "emerald",
  animated = true,
}: {
  feature: string;
  className?: string;
  icon?: "shield" | "lock" | "check";
  color?: "emerald" | "blue" | "purple" | "amber";
  animated?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const colorVariants = {
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-emerald-100 dark:border-emerald-900/50",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
      text: "text-emerald-700 dark:text-emerald-400",
      icon: "text-emerald-600 dark:text-emerald-400",
      hover: "hover:bg-emerald-100 dark:hover:bg-emerald-900/40",
    },
    blue: {
      bg: "bg-blue-50 dark:bg-blue-950/40",
      border: "border-blue-100 dark:border-blue-900/50",
      iconBg: "bg-blue-100 dark:bg-blue-900/50",
      text: "text-blue-700 dark:text-blue-400",
      icon: "text-blue-600 dark:text-blue-400",
      hover: "hover:bg-blue-100 dark:hover:bg-blue-900/40",
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-950/40",
      border: "border-purple-100 dark:border-purple-900/50",
      iconBg: "bg-purple-100 dark:bg-purple-900/50",
      text: "text-purple-700 dark:text-purple-400",
      icon: "text-purple-600 dark:text-purple-400",
      hover: "hover:bg-purple-100 dark:hover:bg-purple-900/40",
    },
    amber: {
      bg: "bg-amber-50 dark:bg-amber-950/40",
      border: "border-amber-100 dark:border-amber-900/50",
      iconBg: "bg-amber-100 dark:bg-amber-900/50",
      text: "text-amber-700 dark:text-amber-400",
      icon: "text-amber-600 dark:text-amber-400",
      hover: "hover:bg-amber-100 dark:hover:bg-amber-900/40",
    },
  };

  const colorClasses = colorVariants[color];

  const iconComponents = {
    shield: <Shield className={cn("h-3.5 w-3.5", colorClasses.icon)} />,
    lock: <Lock className={cn("h-3.5 w-3.5", colorClasses.icon)} />,
    check: <CheckCircle className={cn("h-3.5 w-3.5", colorClasses.icon)} />,
  };

  const alertContent = (
    <div
      className={cn(
        "backdrop-blur-sm border rounded-lg p-2 flex items-center gap-2",
        colorClasses.bg,
        colorClasses.border,
        "shadow-sm",
        className,
      )}
    >
      <div
        className={cn(
          "h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0",
          colorClasses.iconBg,
        )}
      >
        {iconComponents[icon]}
      </div>
      <p className={cn("text-xs font-medium flex-1", colorClasses.text)}>
        {feature}
      </p>
    </div>
  );

  if (animated) {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 20,
            }}
          >
            {alertContent}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return isVisible ? alertContent : null;
}

// New floating privacy notice component
export function FloatingPrivacyNotice({
  message = "Your privacy is protected",
  position = "bottom-right",
  timeout = 5000,
}: {
  message?: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  timeout?: number | false;
}) {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-hide after timeout
  if (timeout && isVisible) {
    setTimeout(() => setIsVisible(false), timeout);
  }

  if (!isVisible) return null;

  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn("fixed z-50", positionClasses[position])}
          initial={{
            opacity: 0,
            scale: 0.9,
            y: position.startsWith("top") ? -20 : 20,
          }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{
            opacity: 0,
            scale: 0.9,
            y: position.startsWith("top") ? -20 : 20,
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-black/90 text-white rounded-full px-4 py-2 shadow-lg backdrop-blur-sm flex items-center gap-2 border border-white/10">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Shield className="h-4 w-4 text-emerald-400" />
            </motion.div>
            <span className="text-sm font-medium">{message}</span>
            <button
              onClick={() => setIsVisible(false)}
              className="ml-2 p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="h-3 w-3 text-white/80" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Add a new enhanced privacy information component
export function PrivacyInfoBox({
  title = "Privacy Features",
  features = [
    {
      title: "End-to-end encryption",
      description: "Your data is fully encrypted from end to end",
      icon: "lock",
      color: "blue",
    },
    {
      title: "Zero-knowledge proofs",
      description: "Verify without revealing sensitive information",
      icon: "shield",
      color: "purple",
    },
    {
      title: "Private transactions",
      description: "All activity remains confidential",
      icon: "check",
      color: "emerald",
    },
  ],
  className,
}: {
  title?: string;
  features?: Array<{
    title: string;
    description: string;
    icon: "lock" | "shield" | "check" | "info";
    color: "blue" | "emerald" | "purple" | "amber";
  }>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm",
        className,
      )}
    >
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-medium text-slate-800 dark:text-slate-200">
          {title}
        </h3>
      </div>

      <div className="p-4 grid gap-3">
        {features.map((feature, index) => {
          const colorVariants = {
            blue: {
              bg: "bg-blue-50 dark:bg-blue-950/40",
              border: "border-blue-100 dark:border-blue-900",
              iconBg: "bg-blue-100 dark:bg-blue-900/50",
              text: "text-blue-700 dark:text-blue-300",
              icon: "text-blue-600 dark:text-blue-400",
            },
            emerald: {
              bg: "bg-emerald-50 dark:bg-emerald-950/40",
              border: "border-emerald-100 dark:border-emerald-900",
              iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
              text: "text-emerald-700 dark:text-emerald-300",
              icon: "text-emerald-600 dark:text-emerald-400",
            },
            purple: {
              bg: "bg-purple-50 dark:bg-purple-950/40",
              border: "border-purple-100 dark:border-purple-900",
              iconBg: "bg-purple-100 dark:bg-purple-900/50",
              text: "text-purple-700 dark:text-purple-300",
              icon: "text-purple-600 dark:text-purple-400",
            },
            amber: {
              bg: "bg-amber-50 dark:bg-amber-950/40",
              border: "border-amber-100 dark:border-amber-900",
              iconBg: "bg-amber-100 dark:bg-amber-900/50",
              text: "text-amber-700 dark:text-amber-300",
              icon: "text-amber-600 dark:text-amber-400",
            },
          };

          const colorClasses = colorVariants[feature.color];

          const iconComponents = {
            lock: <Lock className={cn("h-4 w-4", colorClasses.icon)} />,
            shield: <Shield className={cn("h-4 w-4", colorClasses.icon)} />,
            check: <CheckCircle className={cn("h-4 w-4", colorClasses.icon)} />,
            info: <Info className={cn("h-4 w-4", colorClasses.icon)} />,
          };

          return (
            <div
              key={index}
              className={cn(
                "flex items-start gap-3 p-2.5 rounded-md border",
                colorClasses.bg,
                colorClasses.border,
              )}
            >
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center",
                  colorClasses.iconBg,
                )}
              >
                {iconComponents[feature.icon]}
              </div>
              <div>
                <h4 className={cn("font-medium", colorClasses.text)}>
                  {feature.title}
                </h4>
                <p
                  className={cn("text-xs mt-0.5 opacity-80", colorClasses.text)}
                >
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
