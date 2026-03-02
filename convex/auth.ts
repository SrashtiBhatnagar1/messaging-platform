import { QueryCtx, MutationCtx } from "./_generated/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get the authenticated user ID from Clerk
 * Uses the `sub` claim from the auth token set by Clerk middleware
 */
export const getAuthUserId = async (
  ctx: QueryCtx | MutationCtx
): Promise<string | null> => {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject || null;
};

// Query to get current user info
export const getCurrentUser = query({
  async handler(ctx) {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      return null;
    }

    const users = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", userId))
      .unique();

    return users || null;
  },
});

// Mutation to create or update user profile
export const upsertUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    username: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        username: args.username || existingUser.username,
        firstName: args.firstName || existingUser.firstName,
        lastName: args.lastName || existingUser.lastName,
        imageUrl: args.imageUrl || existingUser.imageUrl,
      });
      return existingUser._id;
    } else {
      // Create new user
      const userId = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        username: args.username || "",
        firstName: args.firstName,
        lastName: args.lastName,
        imageUrl: args.imageUrl || undefined,
        createdAt: Date.now(),
      });
      return userId;
    }
  },
});

// Query to get all users except the current user
export const getAllUsers = query({
  async handler(ctx) {
    const userId = await getAuthUserId(ctx);

    const allUsers = await ctx.db.query("users").collect();

    // Filter out current user
    if (userId) {
      return allUsers.filter((u) => u.clerkId !== userId);
    }

    return allUsers;
  },
});