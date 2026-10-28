import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog.js";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "#/components/ui/drawer.js";
import { useIsMobile } from "#/hooks/use-mobile.js";
import { cn } from "#/lib/utils.js";
import { createContext, useContext, type ComponentProps } from "react";

/**
 * A dialog on desktop and a bottom drawer on mobile. Compose it like `Dialog`:
 * `ResponsiveModal` > `ResponsiveModalContent` > header/title/description/footer.
 */
const IsDrawerContext = createContext(false);

export function ResponsiveModal({
  breakpoint,
  ...props
}: ComponentProps<typeof Dialog> & { breakpoint?: number }) {
  const isMobile = useIsMobile(breakpoint);
  return (
    <IsDrawerContext.Provider value={isMobile}>
      {isMobile ? <Drawer {...props} /> : <Dialog {...props} />}
    </IsDrawerContext.Provider>
  );
}

export function ResponsiveModalContent({
  className,
  drawerClassName,
  dialogClassName,
  closeButton,
  ...props
}: ComponentProps<typeof DialogContent> & {
  /** Extra classes for the mobile drawer only */
  drawerClassName?: string;
  /** Extra classes for the desktop dialog only */
  dialogClassName?: string;
}) {
  return useContext(IsDrawerContext) ? (
    <DrawerContent className={cn(className, drawerClassName)} {...props} />
  ) : (
    <DialogContent
      className={cn(className, dialogClassName)}
      closeButton={closeButton}
      {...props}
    />
  );
}

export function ResponsiveModalHeader(props: ComponentProps<"div">) {
  const Header = useContext(IsDrawerContext) ? DrawerHeader : DialogHeader;
  return <Header {...props} />;
}

export function ResponsiveModalTitle(
  props: ComponentProps<typeof DialogTitle>,
) {
  const Title = useContext(IsDrawerContext) ? DrawerTitle : DialogTitle;
  return <Title {...props} />;
}

export function ResponsiveModalDescription(
  props: ComponentProps<typeof DialogDescription>,
) {
  const Description = useContext(IsDrawerContext)
    ? DrawerDescription
    : DialogDescription;
  return <Description {...props} />;
}

export function ResponsiveModalFooter(props: ComponentProps<"div">) {
  const Footer = useContext(IsDrawerContext) ? DrawerFooter : DialogFooter;
  return <Footer {...props} />;
}
