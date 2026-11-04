"use client";

import { Outlet } from "react-router";

export default function AppLayout() {
  return (
    <div className="vibe-bg flex flex-1 flex-col bg-background">
      <Outlet />
    </div>
  );
}
