import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "./auth";

// Set user as typing in a conversation
export const setTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  async handler(ctx, args) {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("typing")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", userId).eq("conversationId", args.conversationId)
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastTypingAt: now,
      });
    } else {
      await ctx.db.insert("typing", {
        conversationId: args.conversationId,
        userId,
        lastTypingAt: now,
      });
    }

    return { success: true };
  },
});

// Clear typing status
export const clearTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  async handler(ctx, args) {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("typing")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", userId).eq("conversationId", args.conversationId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return { success: true };
  },
});

// Get who is typing in a conversation (excluding current user)
export const getTypingUsers = query({
  args: {
    conversationId: v.id("conversations"),
  },
  async handler(ctx, args) {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      return [];
    }

    const now = Date.now();
    const TYPING_TIMEOUT = 3000; // 3 seconds

    const typingRecords = await ctx.db
      .query("typing")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    // Filter out current user and expired typing indicators
    const activeTypingUsers = typingRecords.filter(
      (record) =>
        record.userId !== userId && now - record.lastTypingAt < TYPING_TIMEOUT
    );

    // Get user details for each typing user
    const typingUsersWithDetails = await Promise.all(
      activeTypingUsers.map(async (record) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", record.userId))
          .first();

        return {
          userId: record.userId,
          firstName: user?.firstName || null,
          lastName: user?.lastName || null,
          username: user?.username || null,
          lastTypingAt: record.lastTypingAt,
        };
      })
    );

    return typingUsersWithDetails;
  },
});

// Cleanup old typing records (optional maintenance)
export const cleanupOldTyping = mutation({
  args: {},
  async handler(ctx) {
    const now = Date.now();
    const CLEANUP_THRESHOLD = 5 * 60 * 1000; // 5 minutes

    const allTyping = await ctx.db.query("typing").collect();

    let deletedCount = 0;

    for (const typing of allTyping) {
      if (now - typing.lastTypingAt > CLEANUP_THRESHOLD) {
        await ctx.db.delete(typing._id);
        deletedCount++;
      }
    }

    return { deletedCount };
  },
});
