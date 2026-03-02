"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface TypingIndicatorProps {
  conversationId: Id<"conversations"> | null;
}

function getDisplayName(user: {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
}): string {
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  if (fullName) {
    return fullName;
  }
  return user.username || "Someone";
}

export function TypingIndicator({ conversationId }: TypingIndicatorProps) {
  const typingUsers = useQuery(
    api.typing.getTypingUsers,
    conversationId ? { conversationId } : "skip"
  );

  if (!typingUsers || typingUsers.length === 0) {
    return null;
  }

  const typingUser = typingUsers[0];
  const displayName = getDisplayName(typingUser);

  return (
    <div className="px-6 py-2 text-sm text-gray-600 bg-gray-50 border-t border-gray-200 flex-shrink-0">
      <div className="flex items-center gap-2">
        <span className="font-medium">{displayName}</span>
        <span>is typing</span>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
