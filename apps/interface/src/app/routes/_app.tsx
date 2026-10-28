"use client";

import { GlobalAlerts } from "#/components/ui/global-alerts.js";
import { HomeFooter } from "#/modules/home/ui/components/home-footer/index.js";
import { HomeNavbar } from "#/modules/home/ui/components/home-navar/index.js";
import { Outlet } from "react-router";

export default function AppLayout() {
  return (
    <div className="vibe-bg flex flex-col min-h-screen bg-background">
      <div className="sticky top-0 z-40">
        <HomeNavbar />
      </div>
      <GlobalAlerts>
        <Outlet />
      </GlobalAlerts>
      <HomeFooter />
    </div>
  );
}
