"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    // Set a timeout in case Clerk doesn't load (e.g., due to clock skew)
    const timeout = setTimeout(() => {
      if (!isLoaded) {
        setTimedOut(true);
        router.push("/sign-in");
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isLoaded, router]);

  useEffect(() => {
    if (!isLoaded && !timedOut) return;

    if (userId) {
      router.push("/dashboard");
    } else if (isLoaded || timedOut) {
      router.push("/sign-in");
    }
  }, [isLoaded, userId, router, timedOut]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg">Redirecting...</p>
    </div>
  );
}
