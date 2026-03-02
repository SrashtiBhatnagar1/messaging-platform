"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

/**
 * Hook to manage typing indicator updates.
 * Throttles updates and automatically clears typing status after inactivity.
 */
export function useTypingIndicator(conversationId: Id<"conversations"> | null) {
  const setTyping = useMutation(api.typing.setTyping);
  const clearTyping = useMutation(api.typing.clearTyping);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingTimeRef = useRef<number>(0);

  const handleTyping = useCallback(() => {
    if (!conversationId) return;

    const now = Date.now();
    const timeSinceLastUpdate = now - lastTypingTimeRef.current;

    // Throttle updates to once per second
    if (timeSinceLastUpdate < 1000) {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout to clear typing after 2 seconds
      timeoutRef.current = setTimeout(() => {
        clearTyping({ conversationId }).catch((err) => {
          console.error("Failed to clear typing:", err);
        });
      }, 2000);

      return;
    }

    // Send typing update
    lastTypingTimeRef.current = now;
    setTyping({ conversationId }).catch((err) => {
      console.error("Failed to set typing:", err);
    });

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout to clear typing after 2 seconds
    timeoutRef.current = setTimeout(() => {
      clearTyping({ conversationId }).catch((err) => {
        console.error("Failed to clear typing:", err);
      });
    }, 2000);
  }, [conversationId, setTyping, clearTyping]);

  const handleStopTyping = useCallback(() => {
    if (!conversationId) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    clearTyping({ conversationId }).catch((err) => {
      console.error("Failed to clear typing:", err);
    });
  }, [conversationId, clearTyping]);

  // Cleanup on unmount or conversation change
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (conversationId) {
        clearTyping({ conversationId }).catch(() => {
          // Ignore errors on cleanup
        });
      }
    };
  }, [conversationId, clearTyping]);

  return {
    handleTyping,
    handleStopTyping,
  };
}
