"use client";

import { Suspense, ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function DashboardSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
