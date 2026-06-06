"use client";

import { useState, useEffect } from "react";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [effectiveType, setEffectiveType] = useState<string | null>(null);

  useEffect(() => {
    // Initial state
    setIsOnline(navigator.onLine);

    // Event listeners for online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Network Information API for slow connection detection
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (connection) {
      setEffectiveType(connection.effectiveType);

      const handleConnectionChange = () => {
        setEffectiveType(connection.effectiveType);
      };

      connection.addEventListener("change", handleConnectionChange);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        connection.removeEventListener("change", handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const isSlowConnection = effectiveType === "2g" || effectiveType === "slow-2g";

  return { isOnline, isSlowConnection, effectiveType };
}
