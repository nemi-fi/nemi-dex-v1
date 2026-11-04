import { ShieldIcon } from "@phosphor-icons/react";
import { Outlet } from "react-router";

export const meta = () => [
  { title: "Nemi Admin Dashboard" },
  { name: "robots", content: "noindex, nofollow" },
];

export default function AdminLayout() {
  return (
    // Header and footer come from the root layout; this marks the admin area under them
    <div className="flex-1 bg-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldIcon className="h-5 w-5 text-yellow-500" />
            <p className="font-semibold text-lg">Nemi Admin</p>
          </div>
          <div className="text-xs text-muted-foreground bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
            Admin Area
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
