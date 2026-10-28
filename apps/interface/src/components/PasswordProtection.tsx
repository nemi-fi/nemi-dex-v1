"use client";

import { Spinner } from "#/components/ui/spinner.js";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog.js";
import { Input } from "#/components/ui/input.js";
import { Button } from "#/components/ui/button.js";
import { useAdminAuth } from "#/lib/auth.js";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { LockIcon, UnlockIcon } from "lucide-react";

interface PasswordProtectionProps {
  children: React.ReactNode;
}

export function PasswordProtection({ children }: PasswordProtectionProps) {
  const { isAuthenticated, authenticate } = useAdminAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setIsOpen(false);

      // Small delay to allow the dialog closing animation to finish
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    setIsUnlocking(true);

    // Add a slight delay to show the loading state
    await new Promise((resolve) => setTimeout(resolve, 800));

    const isValid = authenticate(password);

    if (!isValid) {
      setError("Invalid password");
      setPassword("");
      setIsUnlocking(false);
    }
    // If valid, the useEffect will take care of the transition
  };

  // Circle reveal animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        when: "beforeChildren",
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.3,
        when: "afterChildren",
      },
    },
  };

  const contentVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300,
      },
    },
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              <div className="flex items-center justify-center gap-2">
                <LockIcon className="h-5 w-5" />
                <span>Admin Access Required</span>
              </div>
            </DialogTitle>
          </DialogHeader>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.form
              onSubmit={handleSubmit}
              className="space-y-4 py-4"
              variants={contentVariants}
            >
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  className={`w-full ${error ? "border-red-500 focus-visible:ring-red-200" : ""}`}
                  disabled={isUnlocking}
                  autoFocus
                />
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-red-500"
                  >
                    {error}
                  </motion.p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isUnlocking}>
                {isUnlocking ? (
                  <div className="flex items-center gap-2">
                    <Spinner className="h-4 w-4 text-current" />
                    <span>Unlocking...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <UnlockIcon className="h-4 w-4" />
                    <span>Unlock Access</span>
                  </div>
                )}
              </Button>
            </motion.form>
          </motion.div>
        </DialogContent>
      </Dialog>

      <AnimatePresence mode="wait">
        {showContent ? (
          <motion.div
            initial={{ opacity: 0, clipPath: "circle(0% at center)" }}
            animate={{
              opacity: 1,
              clipPath: "circle(100% at center)",
            }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 100,
              duration: 0.8,
            }}
            className="w-full"
          >
            {children}
          </motion.div>
        ) : (
          <motion.div
            className="w-full flex justify-center items-center py-16"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {!isAuthenticated && !isOpen && (
              <Spinner className="text-primary" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
