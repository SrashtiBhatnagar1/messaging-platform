"use client";

export const dynamic = "force-dynamic";

import type { ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default function ChatLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {children}
    </div>
  );
}
