"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Hook to sync Clerk user data to Convex database
 * Automatically creates or updates user profile when authenticated
 */
export function useSyncUserToConvex() {
  const { user, isLoaded } = useUser();
  const upsertUser = useMutation(api.auth.upsertUser);

  useEffect(() => {
    if (!isLoaded || !user) {
      return;
    }

    const syncUser = async () => {
      try {
        await upsertUser({
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress || "",
          username: user.username || "",
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          imageUrl: user.imageUrl || undefined,
        });
      } catch (error) {
        console.error("Failed to sync user to Convex:", error);
      }
    };

    syncUser();
  }, [user, isLoaded, upsertUser]);
}
