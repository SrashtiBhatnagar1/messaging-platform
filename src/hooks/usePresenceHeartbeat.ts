"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";

/**
 * Hook that sends periodic heartbeat updates to track user presence.
 * Automatically stops when component unmounts or user logs out.
 */
export function usePresenceHeartbeat() {
  const { isSignedIn } = useUser();
  const updatePresence = useMutation(api.presence.updatePresence);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    // Send initial heartbeat
    updatePresence().catch((err) => {
      console.error("Failed to update presence:", err);
    });

    // Send heartbeat every 10 seconds
    intervalRef.current = setInterval(() => {
      updatePresence().catch((err) => {
        console.error("Failed to update presence:", err);
      });
    }, 10000); // 10 seconds

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSignedIn, updatePresence]);
}
