import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "./auth";

// Update user's last seen timestamp (heartbeat)
export const updatePresence = mutation({
  args: {},
  async handler(ctx) {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastSeen: now,
      });
    } else {
      await ctx.db.insert("presence", {
        userId,
        lastSeen: now,
      });
    }

    return { success: true, lastSeen: now };
  },
});

// Get online status for specific users
export const getOnlineUsers = query({
  args: {
    userIds: v.array(v.string()),
  },
  async handler(ctx, args) {
    const now = Date.now();
    const ONLINE_THRESHOLD = 15000; // 15 seconds

    const onlineStatuses = await Promise.all(
      args.userIds.map(async (userId) => {
        const presence = await ctx.db
          .query("presence")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .first();

        const isOnline =
          presence && now - presence.lastSeen < ONLINE_THRESHOLD;

        return {
          userId,
          isOnline,
          lastSeen: presence?.lastSeen || null,
        };
      })
    );

    return onlineStatuses;
  },
});

// Get all currently online users
export const getAllOnlineUsers = query({
  args: {},
  async handler(ctx) {
    const now = Date.now();
    const ONLINE_THRESHOLD = 15000; // 15 seconds

    const allPresence = await ctx.db.query("presence").collect();

    const onlineUserIds = allPresence
      .filter((p) => now - p.lastSeen < ONLINE_THRESHOLD)
      .map((p) => p.userId);

    return onlineUserIds;
  },
});

// Clean up old presence records (optional, for maintenance)
export const cleanupOldPresence = mutation({
  args: {},
  async handler(ctx) {
    const now = Date.now();
    const CLEANUP_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours

    const oldPresence = await ctx.db
      .query("presence")
      .withIndex("by_lastSeen")
      .collect();

    let deletedCount = 0;

    for (const presence of oldPresence) {
      if (now - presence.lastSeen > CLEANUP_THRESHOLD) {
        await ctx.db.delete(presence._id);
        deletedCount++;
      }
    }

    return { deletedCount };
  },
});
