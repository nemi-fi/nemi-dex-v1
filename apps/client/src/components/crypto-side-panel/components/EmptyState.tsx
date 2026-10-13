import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
  hasSearchBar?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  hasSearchBar = false,
}: EmptyStateProps) {
  return (
    <motion.div
      className="flex-1 flex flex-col px-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div
        className={`text-center space-y-4 ${hasSearchBar ? "mt-12" : "mt-16"}`}
      >
        <motion.div
          className="mx-auto w-14 h-14 bg-muted rounded-full flex items-center justify-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.2, ease: "easeOut" }}
        >
          <Icon className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
        </motion.div>

        <motion.div
          className="space-y-3 max-w-xs mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.25 }}
        >
          <h3 className="text-lg font-semibold text-foreground leading-tight">
            {title}
          </h3>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>

          {children && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.2 }}
              className="pt-2"
            >
              {children}
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
