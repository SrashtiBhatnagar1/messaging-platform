"use client";

export const dynamic = "force-dynamic";

import { JSX, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  ChatHeader,
  MessageList,
  MessageInput,
  UserList,
  TypingIndicator,
  GroupChatModal,
} from "@/components/chat";
import { Message, User } from "@/types/chat";
import { Loader2, ArrowLeft, MessageSquare, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePresenceHeartbeat } from "@/hooks/usePresenceHeartbeat";

export default function DashboardPage(): JSX.Element {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const [isMounted, setIsMounted] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState<"list" | "chat">("list");
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  // Send presence heartbeat to track online status
  usePresenceHeartbeat();

  // Convert Clerk user to our User type
  const user: User | null = clerkUser
    ? {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        primaryEmailAddress: clerkUser.primaryEmailAddress
          ? { emailAddress: clerkUser.primaryEmailAddress.emailAddress }
          : undefined,
        username: clerkUser.username || undefined,
        imageUrl: clerkUser.imageUrl,
      }
    : null;

  // Get user's conversations
  const conversations = useQuery(api.messages.getConversations);

  // Get all users for group creation
  const allUsers = useQuery(api.messages.getAllUsers);

  const sendMessage = useMutation(api.messages.sendMessage);
  const markConversationAsRead = useMutation(
    api.messages.markConversationAsRead
  );
  const createGroup = useMutation(api.messages.createGroup);

  // Get messages for current conversation
  const messages = useQuery(
    api.messages.getMessages,
    isMounted && conversationId
      ? { conversationId: conversationId as any }
      : "skip"
  ) as Message[] | null;

  // Handle mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle authentication
  useEffect(() => {
    if (!isMounted || !isLoaded) return;

    if (!user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router, isMounted]);

  const handleUserClick = (newConversationId: string) => {
    setConversationId(newConversationId);
    setIsMobileView("chat");
  };

  const handleCreateGroup = async (
    groupName: string,
    memberIds: string[]
  ): Promise<void> => {
    try {
      const conversationId = await createGroup({
        name: groupName,
        memberIds: memberIds as any,
      });
      setConversationId(conversationId);
      setIsMobileView("chat");
      setIsGroupModalOpen(false);
    } catch (error) {
      console.error("Failed to create group:", error);
      throw error;
    }
  };

  const handleBackToList = () => {
    setIsMobileView("list");
  };

  // Auto-switch to list view on mobile when conversation is cleared
  useEffect(() => {
    if (!conversationId && isMobileView === "chat") {
      setIsMobileView("list");
    }
  }, [conversationId, isMobileView]);

  // Handle send message
  const handleSendMessage = async (content: string): Promise<void> => {
    if (!conversationId || !user) return;

    try {
      await sendMessage({
        conversationId: conversationId as any,
        content,
      });
    } catch (error) {
      console.error("Send error:", error);
      throw error;
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!conversationId) {
        return;
      }

      try {
        await markConversationAsRead({
          conversationId: conversationId as any,
        });
      } catch (error) {
        console.error("Failed to mark messages as read:", error);
      }
    };

    run();
  }, [conversationId, messages?.length, markConversationAsRead]);

  // Loading state
  if (!isMounted || !isLoaded || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <ChatHeader user={user} />

      <div className="flex-1 flex overflow-hidden">
        {/* User List Sidebar - Desktop: always visible, Mobile: only when isMobileView === 'list' */}
        <div
          className={`w-full md:w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col transition-colors duration-300 ${
            isMobileView === "list" ? "flex" : "hidden md:flex"
          }`}
        >
          <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Messages
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Search and connect
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setIsGroupModalOpen(true)}
                className="gap-2 hover:bg-blue-700 active:bg-blue-800 transition-colors"
                title="Create a new group"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">New</span>
              </Button>
            </div>
          </div>
          <UserList
            onUserClick={handleUserClick}
            selectedConversationId={conversationId}
          />
        </div>

        {/* Chat Area - Desktop: always visible, Mobile: only when isMobileView === 'chat' */}
        <div
          className={`flex-1 flex flex-col overflow-hidden ${
            isMobileView === "chat" ? "block" : "hidden md:flex"
          }`}
        >
          {conversationId ? (
            <>
              {/* Mobile chat header with back button */}
              <div className="md:hidden border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0 transition-colors duration-300">
                <div className="flex items-center gap-3 p-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToList}
                    className="gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors -ml-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                      Chat
                    </h2>
                  </div>
                </div>
              </div>

              {/* Messages and Input */}
              <MessageList
                messages={messages || []}
                currentUser={user}
                isLoading={!messages}
              />
              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={!conversationId}
                isSending={false}
                conversationId={conversationId as any}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Choose a user from the list to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Group Chat Modal */}
      <GroupChatModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onCreateGroup={handleCreateGroup}
        availableUsers={
          (allUsers || []).filter((u: any) => u.clerkId !== clerkUser?.id) as any
        }
      />
    </div>
  );
}
