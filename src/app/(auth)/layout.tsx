import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-900">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
