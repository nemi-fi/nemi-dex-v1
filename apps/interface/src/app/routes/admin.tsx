import { Shield } from "lucide-react";
import { Outlet } from "react-router";

export const meta = () => [
  { title: "Nemi Admin Dashboard" },
  { name: "robots", content: "noindex, nofollow" },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-muted/20">
      {/* Admin header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-yellow-500" />
            <h1 className="font-semibold text-lg">Nemi Admin</h1>
          </div>
          <div className="text-xs text-muted-foreground bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
            Admin Area
          </div>
        </div>
      </header>

      {/* Admin content */}
      <div className="container mx-auto px-4 py-8">
        <Outlet />
      </div>

      {/* Admin footer */}
      <footer className="bg-background border-t py-4 mt-auto">
        <div className="container mx-auto px-4">
          <p className="text-xs text-muted-foreground text-center">
            Nemi Admin Dashboard - Restricted Access
          </p>
        </div>
      </footer>
    </div>
  );
}
