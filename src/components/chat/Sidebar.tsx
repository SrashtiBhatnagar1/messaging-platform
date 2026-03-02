"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-gray-200 bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto p-4 space-y-2">
        <Link
          href="/"
          className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors"
        >
          💬 New Chat
        </Link>
        <Link
          href="/conversations"
          className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors"
        >
          📋 Conversations
        </Link>
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-200 p-4 flex items-center justify-between">
        <span className="text-sm text-gray-600">Profile</span>
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </aside>
  );
}
