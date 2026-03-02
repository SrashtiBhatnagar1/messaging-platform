import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    username: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  presence: defineTable({
    userId: v.string(),
    lastSeen: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_lastSeen", ["lastSeen"]),

  typing: defineTable({
    conversationId: v.id("conversations"),
    userId: v.string(),
    lastTypingAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_user_conversation", ["userId", "conversationId"]),

  conversations: defineTable({
    participantIds: v.array(v.string()),
    lastMessageAt: v.number(),
    createdAt: v.number(),
    name: v.optional(v.string()),  // Group name, undefined for 1-1 chats
    isGroup: v.optional(v.boolean()), // true for groups, undefined for 1-1
  })
    .index("by_participants", ["participantIds"])
    .index("by_lastMessageAt", ["lastMessageAt"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.string(),
    receiverId: v.optional(v.string()),
    content: v.string(),
    status: v.optional(v.union(v.literal("delivered"), v.literal("seen"))),
    readBy: v.optional(v.array(v.string())),
    reactions: v.optional(v.array(v.object({
      emoji: v.string(),
      users: v.array(v.string()),
    }))),
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_sender", ["senderId"])
    .index("by_createdAt", ["createdAt"]),
});
