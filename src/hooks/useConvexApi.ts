import { useMemo } from "react";

let cachedApi: any = null;

async function loadApi() {
  if (!cachedApi) {
    try {
      const module = await import("@/convex/_generated/api");
      cachedApi = module.api;
    } catch (error) {
      console.error("Failed to load Convex API:", error);
      return null;
    }
  }
  return cachedApi;
}

export function useConvexApi() {
  // This will resolve the API promise - it should be synchronously available
  // since Convex generates it as a module
  return useMemo(() => {
    // Try synchronous first (should work with Convex)
    try {
      const api = require("@/convex/_generated/api").api;
      if (api && api.messages) {
        return api;
      }
    } catch (e) {
      // Fall back to async
      console.warn("API not immediately available, attempting async load");
    }
    return null;
  }, []);
}
