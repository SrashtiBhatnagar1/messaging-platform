"use client";

import { ReactNode } from "react";
import { useSyncUserToConvex } from "@/hooks/useSyncUserToConvex";

export function UserSyncProvider({ children }: { children: ReactNode }) {
  useSyncUserToConvex();

  return <>{children}</>;
}
