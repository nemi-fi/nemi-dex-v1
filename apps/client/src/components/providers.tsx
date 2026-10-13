"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { useConsoleSecurityWarning } from "@/hooks/use-console-security-warning";
import { steps } from "@/lib/steps";
import { TourCard } from "@/widgets/tour";
import NiceModal from "@ebay/nice-modal-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Onborda, OnbordaProvider } from "onborda";
import { Suspense, useState, type ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  useConsoleSecurityWarning();
  // Create a client
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {},
        },
      }),
  );

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QueryClientProvider client={queryClient}>
        <OnbordaProvider>
          <Onborda
            steps={steps}
            showOnborda={true}
            shadowRgb="55,48,163"
            shadowOpacity="0.8"
            cardComponent={TourCard}
            cardTransition={{ duration: 2, type: "tween" }}
          >
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              disableTransitionOnChange
            >
              <NiceModal.Provider>{children}</NiceModal.Provider>
            </ThemeProvider>
            <Toaster position="bottom-right" />
            <ReactQueryDevtools />
          </Onborda>
        </OnbordaProvider>
      </QueryClientProvider>
    </Suspense>
  );
}
