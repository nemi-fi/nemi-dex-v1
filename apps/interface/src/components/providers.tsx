"use client";

import { ThemeProvider } from "#/components/theme-provider.js";
import { Toaster } from "#/components/ui/sonner.js";
import { useConsoleSecurityWarning } from "#/hooks/use-console-security-warning.js";
import NiceModal from "@ebay/nice-modal-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
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
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          <NiceModal.Provider>{children}</NiceModal.Provider>
        </ThemeProvider>
        <Toaster position="bottom-right" />
        <ReactQueryDevtools />
      </QueryClientProvider>
    </Suspense>
  );
}
