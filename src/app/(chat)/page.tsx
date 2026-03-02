"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  UserList,
  MessageList,
  MessageInput,
} from "@/components/chat";
import { Message, User } from "@/types/chat";
import { Loader2, MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ChatPage() {
  const { user: clerkUser, isLoaded } = useUser();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState<"list" | "chat">("list");

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

  // Get messages for current conversation
  const messages = useQuery(
    api.messages.getMessages,
    conversationId ? { conversationId: conversationId as any } : "skip"
  ) as Message[] | undefined;

  // Get conversation details
  const conversationDetails = useQuery(
    api.messages.getConversationDetails,
    conversationId ? { conversationId: conversationId as any } : "skip"
  );

  const sendMessage = useMutation(api.messages.sendMessage);
  const markConversationAsRead = useMutation(api.messages.markConversationAsRead);

  const handleUserClick = (newConversationId: string) => {
    setConversationId(newConversationId);
    // Switch to chat view on mobile
    setIsMobileView("chat");
  };

  const handleBackToList = () => {
    setIsMobileView("list");
  };

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

  if (!isLoaded || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* User List Sidebar - Desktop: always visible, Mobile: only when isMobileView === 'list' */}
      <div
        className={`w-full md:w-80 border-r border-gray-200 bg-white ${
          isMobileView === "list" ? "block" : "hidden md:block"
        }`}
      >
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-xl font-bold text-gray-900">Messages</h2>
        </div>
        <UserList onUserClick={handleUserClick} />
      </div>

      {/* Chat Area - Desktop: always visible, Mobile: only when isMobileView === 'chat' */}
      <div
        className={`flex-1 flex flex-col ${
          isMobileView === "chat" ? "block" : "hidden md:flex"
        }`}
      >
        {conversationId ? (
          <>
            {/* Chat Header */}
            <div className="border-b border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                {/* Back button for mobile */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToList}
                  className="md:hidden"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>

                {/* User Info */}
                {conversationDetails?.otherUser && (
                  <>
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        src={conversationDetails.otherUser.imageUrl}
                        alt={conversationDetails.otherUser.username || "User"}
                      />
                      <AvatarFallback>
                        {conversationDetails.otherUser.firstName?.[0]?.toUpperCase() ||
                          conversationDetails.otherUser.username?.[0]?.toUpperCase() ||
                          conversationDetails.otherUser.email?.[0]?.toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-gray-900 truncate">
                        {conversationDetails.otherUser.firstName || conversationDetails.otherUser.lastName
                          ? `${conversationDetails.otherUser.firstName || ""} ${conversationDetails.otherUser.lastName || ""}`.trim()
                          : conversationDetails.otherUser.username || "User"}
                      </h2>
                      <p className="text-sm text-gray-500 truncate">
                        {conversationDetails.otherUser.email}
                      </p>
                    </div>
                  </>
                )}
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
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500">
                Choose a user from the list to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
