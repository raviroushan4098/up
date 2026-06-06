"use client";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { WifiOff } from "lucide-react";

export function NetworkStatusBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium shadow-md animate-in slide-in-from-top-full">
      <WifiOff className="size-4" />
      <span>You are currently offline. Please check your internet connection.</span>
    </div>
  );
}
