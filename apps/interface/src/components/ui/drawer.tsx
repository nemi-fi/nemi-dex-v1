"use client";

import { useIsMobile } from "#/hooks/use-mobile.js";
import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "#/components/ui/dialog.js";
import { Button } from "#/components/ui/button.js";
import { cn } from "#/lib/utils.js";

// Basic components with minimal wrapper
const Drawer = (props: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root data-slot="drawer" {...props} />
);

const DrawerTrigger = (
  props: React.ComponentProps<typeof DrawerPrimitive.Trigger>,
) => <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;

const DrawerPortal = (
  props: React.ComponentProps<typeof DrawerPrimitive.Portal>,
) => <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;

const DrawerClose = (
  props: React.ComponentProps<typeof DrawerPrimitive.Close>,
) => <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;

// Overlay with animation
const DrawerOverlay = ({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) => (
  <DrawerPrimitive.Overlay
    data-slot="drawer-overlay"
    className={cn(
      "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
);

// Improved content component with mobile detection
const DrawerContent = ({
  className,
  children,
  fullScreenOnMobile = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> & {
  fullScreenOnMobile?: boolean;
}) => {
  const isMobile = useIsMobile();

  // Mobile-optimized classes
  const mobileClasses =
    fullScreenOnMobile && isMobile
      ? "h-[100svh] max-h-[100svh] rounded-none"
      : "";

  // Direction-specific classes
  const directionClasses = {
    top: "inset-x-0 top-0 border-b rounded-b-lg",
    bottom: "inset-x-0 bottom-0 border-t rounded-t-lg",
    left: "inset-y-0 left-0 border-r h-full",
    right: "inset-y-0 right-0 border-l h-full",
  };

  // Width/height classes
  const sizeClasses = {
    // When mobile + fullscreen, use full width/height
    mobile: isMobile && fullScreenOnMobile ? "w-full" : "w-3/4 sm:max-w-sm",
    // Height adjustments for top/bottom drawers
    height:
      isMobile && fullScreenOnMobile ? "max-h-[100vh]" : "max-h-[80vh] mt-24",
  };

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          // Base styles
          "fixed z-50 bg-background flex flex-col group/drawer-content",

          // Mobile optimization
          mobileClasses,

          // Direction-specific styling
          "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b",

          "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0",
          `data-[vaul-drawer-direction=bottom]:${sizeClasses.height}`,
          !fullScreenOnMobile &&
            "data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t",

          // Side drawers
          "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0",
          "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0",

          // Width for side drawers
          `data-[vaul-drawer-direction=left]:${sizeClasses.mobile}`,
          `data-[vaul-drawer-direction=right]:${sizeClasses.mobile}`,

          className,
        )}
        {...props}
      >
        {/* Drag handle for bottom drawers */}
        <div className="bg-muted mx-auto mt-4 hidden h-2 w-[100px] rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
};

// Simple container components
const DrawerHeader = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="drawer-header"
    className={cn("flex flex-col gap-1.5 p-4", className)}
    {...props}
  />
);

const DrawerFooter = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="drawer-footer"
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
);

const DrawerTitle = ({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) => (
  <DrawerPrimitive.Title
    data-slot="drawer-title"
    className={cn("text-foreground font-semibold", className)}
    {...props}
  />
);

const DrawerDescription = ({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) => (
  <DrawerPrimitive.Description
    data-slot="drawer-description"
    className={cn("text-muted-foreground text-sm", className)}
    {...props}
  />
);

// Confirmation drawer for unsaved changes
function ConfirmDataDrawer({
  children,
  open,
  onOpenChange,
  hasDataChanged = false,
  confirmationMessage = "You have unsaved changes. Are you sure you want to close?",
  confirmationTitle = "Confirm Close",
  onConfirm,
  ...props
}: React.ComponentProps<typeof Drawer> & {
  hasDataChanged?: boolean;
  confirmationMessage?: string;
  confirmationTitle?: string;
  onConfirm?: () => void;
}) {
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && open && hasDataChanged) {
      setShowConfirmDialog(true);
      return;
    }
    onOpenChange?.(newOpen);
  };

  const handleConfirmClose = () => {
    setShowConfirmDialog(false);
    onOpenChange?.(false);
    onConfirm?.();
  };

  return (
    <>
      <Drawer open={open} onOpenChange={handleOpenChange} {...props}>
        {children}
      </Drawer>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmationTitle}</DialogTitle>
            <DialogDescription>{confirmationMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmClose}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  ConfirmDataDrawer,
};
