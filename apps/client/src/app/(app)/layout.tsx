"use client";

import { GlobalAlerts } from "@/components/ui/global-alerts";
import { HomeFooter } from "@/modules/home/ui/components/home-footer";
import { HomeNavbar } from "@/modules/home/ui/components/home-navar";
import "../globals.css";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-40">
        <HomeNavbar />
      </div>
      <GlobalAlerts>{children}</GlobalAlerts>
      <HomeFooter />
    </div>
  );
}
