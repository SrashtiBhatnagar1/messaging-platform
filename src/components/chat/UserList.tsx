"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Loader2, User as UserIcon, Users } from "lucide-react";
import { formatConversationTime } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";

interface UserListProps {
  onUserClick: (conversationId: string) => void;
  selectedConversationId?: string | null;
}

export function UserList({ onUserClick, selectedConversationId }: UserListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { user: clerkUser } = useUser();
  const conversations = useQuery(api.messages.getConversations);
  const sidebarUsers = useQuery(api.messages.getSidebarUsers);
  const allUsers = useQuery(api.messages.getAllUsers);
  const getOrCreateConversation = useMutation(api.messages.getOrCreateConversation);

  // Create a map of clerkId -> user for quick lookup
  const userMap = new Map(
    (allUsers || []).map((user) => [user.clerkId, user])
  );

  // Get all clerkIds from existing conversations (for 1-1 chats)
  const existingConversationUserIds = new Set<string>();
  (conversations || []).forEach((conv) => {
    if (!conv.isGroup) {
      // For 1-1 conversations, add the other user's ID
      const otherUserId = conv.participantIds.find(
        (id) => id !== clerkUser?.id
      );
      if (otherUserId) {
        existingConversationUserIds.add(otherUserId);
      }
    }
  });

  // Prepare conversation data for display
  const conversationData = (conversations || []).map((conv) => {
    const isGroup = conv.isGroup === true;

    if (isGroup) {
      // Group conversation
      const memberCount = conv.participantIds.length;
      return {
        id: conv._id,
        type: "group" as const,
        name: conv.name || "Unnamed Group",
        memberCount,
        lastMessageAt: conv.lastMessageAt,
        imageUrl: undefined, // Groups don't have a single image
        searchText: conv.name || "",
      };
    } else {
      // 1-1 conversation - find the other user
      const otherUserId = conv.participantIds.find(
        (id) => id !== clerkUser?.id
      );
      const otherUser = otherUserId ? userMap.get(otherUserId) : null;

      return {
        id: conv._id,
        type: "direct" as const,
        name: otherUser
          ? `${otherUser.firstName || ""} ${otherUser.lastName || ""}`.trim() ||
            otherUser.username ||
            otherUser.email ||
            "Unknown"
          : "Unknown",
        imageUrl: otherUser?.imageUrl,
        lastMessageAt: conv.lastMessageAt,
        searchText: `${otherUser?.firstName || ""} ${otherUser?.lastName || ""} ${
          otherUser?.username || ""
        } ${otherUser?.email || ""}`.toLowerCase(),
      };
    }
  });

  // Prepare available users data (users they can start new conversations with)
  const availableUsersData = (sidebarUsers || [])
    .filter((user) => !existingConversationUserIds.has(user.clerkId))
    .map((user) => ({
      clerkId: user.clerkId,
      type: "available-user" as const,
      name: user.firstName || user.lastName
        ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
        : user.username || "User",
      imageUrl: user.imageUrl,
      isOnline: user.isOnline,
      searchText: `${user.firstName || ""} ${user.lastName || ""} ${
        user.username || ""
      } ${user.email || ""}`.toLowerCase(),
    }));

  // Filter conversations and available users based on search query
  const filteredConversations = conversationData.filter((conv) => {
    const query = searchQuery.toLowerCase();
    return conv.searchText.toLowerCase().includes(query);
  });

  const filteredAvailableUsers = availableUsersData.filter((user) => {
    const query = searchQuery.toLowerCase();
    return user.searchText.toLowerCase().includes(query);
  });

  const handleAvailableUserClick = async (userId: string) => {
    try {
      const conversationId = await getOrCreateConversation({
        otherUserId: userId,
      });
      onUserClick(conversationId as string);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  if (!conversations || !sidebarUsers || !allUsers) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const hasConversations = filteredConversations.length > 0;
  const hasAvailableUsers = filteredAvailableUsers.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <Input
            type="text"
            placeholder="Search conversations or people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations and Users List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {!hasConversations && !hasAvailableUsers ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <UserIcon className="w-12 h-12 mb-2" />
              <p className="text-center">
                {searchQuery ? "No conversations or people found" : "No conversations yet"}
              </p>
              {!searchQuery && (
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Select a person below to start chatting
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Conversations Section */}
              {hasConversations && (
                <>
                  {filteredConversations.length === conversationData.length && searchQuery === "" && (
                    <p className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Conversations
                    </p>
                  )}
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => onUserClick(conv.id as string)}
                      className={`w-full p-3 rounded-lg cursor-pointer transition-all duration-200 ease-out text-left active:scale-[0.98] ${
                        selectedConversationId === conv.id
                          ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-[1.01] border border-transparent"
                      }`}
                    >
                      <div className="flex gap-3 items-start">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          {conv.type === "group" ? (
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                          ) : (
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={conv.imageUrl} alt={conv.name} />
                              <AvatarFallback>
                                {conv.name[0]?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* TOP ROW: Name | Time */}
                          <div className="flex justify-between items-center mb-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {conv.name}
                            </p>
                            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2 flex-shrink-0">
                              {conv.lastMessageAt
                                ? formatConversationTime(conv.lastMessageAt)
                                : ""}
                            </span>
                          </div>

                          {/* BOTTOM ROW: Preview/Member Count */}
                          <div className="flex justify-between items-center gap-2">
                            {conv.type === "group" ? (
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {conv.memberCount} members
                              </p>
                            ) : (
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                Click to chat
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Available Users Section */}
              {hasAvailableUsers && (
                <>
                  {filteredAvailableUsers.length === availableUsersData.length && searchQuery === "" && (
                    <p className="px-3 py-2 mt-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      People
                    </p>
                  )}
                  {filteredAvailableUsers.map((user) => (
                    <button
                      key={user.clerkId}
                      onClick={() => handleAvailableUserClick(user.clerkId)}
                      className={`w-full p-3 rounded-lg cursor-pointer transition-all duration-200 ease-out text-left active:scale-[0.98] hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-[1.01] border border-transparent`}
                    >
                      <div className="flex gap-3 items-start">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user.imageUrl} alt={user.name} />
                            <AvatarFallback>
                              {user.name[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          {user.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {user.isOnline ? "Online" : "Offline"}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
