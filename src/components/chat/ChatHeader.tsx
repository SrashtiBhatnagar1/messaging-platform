"use client";

import { User } from "@/types/chat";

interface ChatHeaderProps {
  user: User;
}

export function ChatHeader({ user }: ChatHeaderProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3 md:py-4 flex-shrink-0 transition-colors duration-300">
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
            Chat Dashboard
          </h1>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
            {user.primaryEmailAddress?.emailAddress}
          </p>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          {user.imageUrl && (
            <img
              src={user.imageUrl}
              alt={user.username || "User"}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full ring-2 ring-gray-200 dark:ring-gray-700"
            />
          )}
        </div>
      </div>
    </div>
  );
}
