"use client";

import { BlockchainControls } from "@/components/BlockchainControls";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/lib/auth";
import { LogOutIcon } from "lucide-react";

export function BlockchainControlsWrapper() {
  const { logout } = useAdminAuth();

  return (
    <div className="w-full">
      <div className="mb-4 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOutIcon className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
      <BlockchainControls />
    </div>
  );
}
