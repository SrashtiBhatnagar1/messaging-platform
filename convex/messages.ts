import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "./auth";

function getDisplayName(user: {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
} | null): string {
  if (!user) {
    return "Unknown";
  }

  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  if (fullName) {
    return fullName;
  }

  if (user.username) {
    return user.username;
  }

  return user.email || "Unknown";
}

// Toggle reaction on a message
export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  async handler(ctx, args) {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    const existingReactions = message.reactions || [];
    let updatedReactions = [...existingReactions];

    // Find if this emoji already has reactions
    const emojiReactionIndex = updatedReactions.findIndex(
      (r) => r.emoji === args.emoji
    );

    if (emojiReactionIndex !== -1) {
      // Emoji exists, toggle user
      const emojiReaction = updatedReactions[emojiReactionIndex];
      const userIndex = emojiReaction.users.indexOf(userId);

      if (userIndex !== -1) {
        // User already reacted, remove them
        emojiReaction.users = emojiReaction.users.filter((id) => id !== userId);
        
        // If no users left, remove the emoji entirely
        if (emojiReaction.users.length === 0) {
          updatedReactions = updatedReactions.filter(
            (r) => r.emoji !== args.emoji
          );
        } else {
          updatedReactions[emojiReactionIndex] = emojiReaction;
        }
      } else {
        // User hasn't reacted with this emoji, add them
        emojiReaction.users.push(userId);
        updatedReactions[emojiReactionIndex] = emojiReaction;
      }
    } else {
      // New emoji reaction
      updatedReactions.push({
        emoji: args.emoji,
        users: [userId],
      });
    }

    await ctx.db.patch(args.messageId, {
      reactions: updatedReactions.length > 0 ? updatedReactions : undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete own message (soft delete)
export const deleteMessage = mutation({
    args: {
      messageId: v.id("messages"),
    },
    async handler(ctx, args) {
      const userId = await getAuthUserId(ctx);

      if (!userId) {
        throw new Error("Not authenticated");
      }

      const message = await ctx.db.get(args.messageId);

      if (!message) {
        throw new Error("Message not found");
      }

      // Ensure user can only delete their own messages
      if (message.senderId !== userId) {
        throw new Error("You can only delete your own messages");
      }

      // Soft delete: mark as deleted, don't remove from database
      await ctx.db.patch(args.messageId, {
        isDeleted: true,
        deletedAt: Date.now(),
        updatedAt: Date.now(),
      });

      return { success: true };
    },
  });

// Get all messages for a conversation
export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  async handler(ctx, args) {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      return [];
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();

    // Fetch sender details for each message
    const messagesWithSenders = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", msg.senderId))
          .first();

        return {
          ...msg,
          readBy: msg.readBy || [],
          senderName: sender?.username || null,
          senderEmail: sender?.email || null,
          senderFirstName: sender?.firstName || null,
          senderLastName: sender?.lastName || null,
        };
      })
    );

    return messagesWithSenders;
  },
});

// Send a message

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
  },
  async handler(ctx, args) {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("Not authenticated");
    }

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: userId,
      content: args.content,
      readBy: [userId],
        isDeleted: false,
        deletedAt: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update conversation's last message time
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: Date.now(),
    });

    return messageId;
  },
});

// Get all users (for group creation)
export const getAllUsers = query({
  async handler(ctx) {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      return [];
    }

    const allUsers = await ctx.db.query("users").collect();

    return allUsers.map((user) => ({
      _id: user._id,
      clerkId: user.clerkId,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
    }));
  },
});

// Get sidebar users with unread status and latest message preview
export const getSidebarUsers = query({
  async handler(ctx) {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      return [];
    }

    const now = Date.now();
    const ONLINE_THRESHOLD = 15000; // 15 seconds

    const allUsers = await ctx.db.query("users").collect();
    const usersByClerkId = new Map(
      allUsers.map((user) => [user.clerkId, user])
    );
    const otherUsers = allUsers.filter((user) => user.clerkId !== userId);

    // Get all presence records
    const allPresence = await ctx.db.query("presence").collect();
    const presenceByUserId = new Map(
      allPresence.map((p) => [p.userId, p])
    );

    const allConversations = await ctx.db.query("conversations").collect();
    const myDirectConversations = allConversations.filter(
      (conv) =>
        conv.participantIds.length === 2 && conv.participantIds.includes(userId)
    );

    const sidebarUsers = await Promise.all(
      otherUsers.map(async (otherUser) => {
        const conversation = myDirectConversations.find((conv) =>
          conv.participantIds.includes(otherUser.clerkId)
        );

        // Check if user is online
        const presence = presenceByUserId.get(otherUser.clerkId);
        const isOnline = presence && now - presence.lastSeen < ONLINE_THRESHOLD;

        if (!conversation) {
          return {
            _id: otherUser._id,
            clerkId: otherUser.clerkId,
            firstName: otherUser.firstName,
            lastName: otherUser.lastName,
            username: otherUser.username,
            email: otherUser.email,
            imageUrl: otherUser.imageUrl,
            conversationId: null,
            unreadCount: 0,
            hasUnread: false,
            lastMessagePreview: "",
            lastMessageSenderName: null,
            lastMessageAt: 0,
            isOnline: isOnline || false,
          };
        }

        const conversationMessages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) =>
            q.eq("conversationId", conversation._id)
          )
          .order("desc")
          .collect();

        const latestMessage = conversationMessages[0];
        const latestMessageSender = latestMessage
          ? usersByClerkId.get(latestMessage.senderId)
          : null;

        const unreadCount = conversationMessages.filter(
          (message) =>
            message.senderId !== userId && !(message.readBy || []).includes(userId)
        ).length;

        return {
          _id: otherUser._id,
          clerkId: otherUser.clerkId,
          firstName: otherUser.firstName,
          lastName: otherUser.lastName,
          username: otherUser.username,
          email: otherUser.email,
          imageUrl: otherUser.imageUrl,
          conversationId: conversation._id,
          unreadCount,
          hasUnread: unreadCount > 0,
          lastMessagePreview: latestMessage
            ? latestMessage.content.slice(0, 40)
            : "",
          lastMessageSenderName: latestMessage
            ? latestMessage.senderId === userId
              ? "You"
              : getDisplayName(latestMessageSender || null)
            : null,
          lastMessageAt: latestMessage
            ? latestMessage.createdAt
            : conversation.lastMessageAt,
          isOnline: isOnline || false,
        };
      })
    );

    return sidebarUsers.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  },
});

// Mark all incoming messages in a conversation as read for current user
export const markConversationAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  async handler(ctx, args) {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("Not authenticated");
    }

    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation || !conversation.participantIds.includes(userId)) {
      return { updatedCount: 0 };
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    let updatedCount = 0;

    for (const message of messages) {
      if (message.senderId === userId) {
        continue;
      }

      const existingReadBy = message.readBy || [];
      if (!existingReadBy.includes(userId)) {
        await ctx.db.patch(message._id, {
          readBy: [...existingReadBy, userId],
          updatedAt: Date.now(),
        });
        updatedCount += 1;
      }
    }

    return { updatedCount };
  },
});

// Get conversations for the current user
export const getConversations = query({
  async handler(ctx) {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      return [];
    }

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_lastMessageAt")
      .order("desc")
      .collect();

    // Filter conversations that include the current user
    return conversations.filter((conv) =>
      conv.participantIds.includes(userId)
    );
  },
});

// Create a new conversation
export const createConversation = mutation({
  args: {
    participantIds: v.array(v.string()),
  },
  async handler(ctx, args) {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Ensure current user is in the conversation
    const participants = Array.from(new Set([userId, ...args.participantIds]));

    const conversationId = await ctx.db.insert("conversations", {
      participantIds: participants,
      createdAt: Date.now(),
      lastMessageAt: Date.now(),
    });

    return conversationId;
  },
});

// Create a new group conversation
export const createGroup = mutation({
  args: {
    name: v.string(),
    memberIds: v.array(v.string()),
  },
  async handler(ctx, args) {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Validate group name
    if (!args.name.trim()) {
      throw new Error("Group name cannot be empty");
    }

    // Ensure current user is in the group and deduplicate
    const participants = Array.from(new Set([userId, ...args.memberIds]));

    // Ensure at least 2 members (user + at least 1 other)
    if (participants.length < 2) {
      throw new Error("Group must have at least 2 members");
    }

    const conversationId = await ctx.db.insert("conversations", {
      participantIds: participants,
      name: args.name.trim(),
      isGroup: true,
      createdAt: Date.now(),
      lastMessageAt: Date.now(),
    });

    return conversationId;
  },
});

// Get or create a one-on-one conversation
export const getOrCreateConversation = mutation({
  args: {
    otherUserId: v.string(),
  },
  async handler(ctx, args) {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Find existing conversation between these two users
    const allConversations = await ctx.db.query("conversations").collect();
    
    const existingConversation = allConversations.find((conv) => {
      return (
        conv.participantIds.length === 2 &&
        conv.participantIds.includes(userId) &&
        conv.participantIds.includes(args.otherUserId)
      );
    });

    if (existingConversation) {
      return existingConversation._id;
    }

    // Create new conversation
    const conversationId = await ctx.db.insert("conversations", {
      participantIds: [userId, args.otherUserId],
      createdAt: Date.now(),
      lastMessageAt: Date.now(),
    });

    return conversationId;
  },
});

// Get conversation details with participant info
export const getConversationDetails = query({
  args: {
    conversationId: v.id("conversations"),
  },
  async handler(ctx, args) {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      return null;
    }

    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation) {
      return null;
    }

    // Get other participant's info (for one-on-one chats)
    const otherUserId = conversation.participantIds.find((id) => id !== userId);

    if (!otherUserId) {
      return null;
    }

    // Find the user in the database
    const otherUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", otherUserId))
      .first();

    return {
      conversationId: conversation._id,
      otherUser: otherUser
        ? {
            id: otherUser.clerkId,
            firstName: otherUser.firstName,
            lastName: otherUser.lastName,
            username: otherUser.username,
            email: otherUser.email,
            imageUrl: otherUser.imageUrl,
          }
        : null,
    };
  },
});
