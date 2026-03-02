"use client";

import { useRef, useEffect, useState } from "react";
import { Message, User } from "@/types/chat";
import { Loader2, MessageSquare, Bell, ArrowDown, Smile, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMessageTimestamp } from "@/lib/utils";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

interface MessageListProps {
  messages: Message[];
  currentUser: User;
  isLoading: boolean;
}

export function MessageList({
  messages,
  currentUser,
  isLoading,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [recentMessageIds, setRecentMessageIds] = useState<Set<string>>(new Set());
  const [animatingMessageIds, setAnimatingMessageIds] = useState<Set<string>>(new Set());
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showNewMessagesButton, setShowNewMessagesButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
    const [showDeleteMenu, setShowDeleteMenu] = useState<string | null>(null);
  const lastMessageCountRef = useRef(messages.length);
  const previousMessageIdsRef = useRef<Set<string>>(new Set());

  const toggleReaction = useMutation(api.messages.toggleReaction);
  const deleteMessage = useMutation(api.messages.deleteMessage);

  // Check if user is near bottom of scroll container
  const checkIfNearBottom = () => {
    const container = scrollContainerRef.current;
    if (!container) return true;

    const threshold = 150; // pixels from bottom
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    return distanceFromBottom <= threshold;
  };

  // Handle scroll events
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const nearBottom = checkIfNearBottom();
      setIsNearBottom(nearBottom);

      // Hide button when user scrolls to bottom
      if (nearBottom) {
        setShowNewMessagesButton(false);
        setUnreadCount(0);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Track new messages and remove "new" indicator after 5 seconds
  useEffect(() => {
    const newMessages = messages.filter(
      (msg) => Date.now() - msg.createdAt < 5000 && msg.senderId !== currentUser.id
    );
    
    if (newMessages.length > 0) {
      const newIds = new Set(newMessages.map(msg => msg._id));
      setRecentMessageIds(newIds);
      
      // Remove "new" indicator after 5 seconds
      const timer = setTimeout(() => {
        setRecentMessageIds(new Set());
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [messages, currentUser.id]);

  // Track newly rendered messages for animation
  useEffect(() => {
    const currentMessageIds = new Set(messages.map(msg => msg._id));
    const newMessageIds = new Set<string>();
    
    currentMessageIds.forEach(id => {
      if (!previousMessageIdsRef.current.has(id)) {
        newMessageIds.add(id);
      }
    });
    
    if (newMessageIds.size > 0) {
      setAnimatingMessageIds(newMessageIds);
      
      // Remove animation class after animation completes (250ms)
      const timer = setTimeout(() => {
        setAnimatingMessageIds(new Set());
      }, 250);
      
      return () => clearTimeout(timer);
    }
    
    previousMessageIdsRef.current = currentMessageIds;
  }, [messages]);

  // Smart auto-scroll: only scroll if user is near bottom
  useEffect(() => {
    const hasNewMessages = messages.length > lastMessageCountRef.current;
    lastMessageCountRef.current = messages.length;

    if (!hasNewMessages) return;

    if (isNearBottom) {
      // User is near bottom, auto-scroll
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    } else {
      // User has scrolled up, show button instead
      setShowNewMessagesButton(true);
      setUnreadCount((prev) => prev + 1);
    }
  }, [messages, isNearBottom]);

  // Initial scroll to bottom
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ block: "end" });
    }
  }, [messages.length === 0]); // Only on mount when messages load

  // Close reaction picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.reaction-picker-container')) {
        setShowReactionPicker(null);
            if (!target.closest('.delete-menu-container')) {
              setShowDeleteMenu(null);
            }
      }
    };

    if (showReactionPicker || showDeleteMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showReactionPicker, showDeleteMenu]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
    setShowNewMessagesButton(false);
    setUnreadCount(0);
  };

  const handleReactionClick = async (messageId: string, emoji: string) => {
    try {
      await toggleReaction({
        messageId: messageId as Id<"messages">,
        emoji,
      });
      setShowReactionPicker(null);
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage({
        messageId: messageId as Id<"messages">,
      });
      setShowDeleteMenu(null);
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 scrollbar-track-transparent dark:scrollbar-thumb-gray-700 p-4 md:p-6 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative transition-colors duration-300" ref={scrollContainerRef}>
      <div className="space-y-3 max-w-4xl mx-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center p-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                No messages yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Send a message below to start the conversation! 👇
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isSentMessage = message.senderId === currentUser.id;
            const isNewMessage = recentMessageIds.has(message._id);
            const shouldAnimate = animatingMessageIds.has(message._id);
            
            // Display name only for received messages
            let displayName = "";
            if (!isSentMessage) {
              if (message.senderFirstName || message.senderLastName) {
                const firstName = message.senderFirstName || "";
                const lastName = message.senderLastName || "";
                displayName = `${firstName} ${lastName}`.trim();
              } else if (message.senderName && message.senderName !== "Anonymous") {
                displayName = message.senderName;
              } else if (message.senderEmail) {
                displayName = message.senderEmail;
              } else {
                displayName = "Anonymous";
              }
            }
            
            return (
              <div key={message._id} className={`flex ${isSentMessage ? 'justify-end' : 'justify-start'} ${shouldAnimate ? 'animate-fadeInUp' : ''}`}>
                <div className={`flex flex-col ${isSentMessage ? 'items-end' : 'items-start'} gap-1`}>
                  {!isSentMessage && displayName && (
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 px-3">
                      {displayName}
                    </p>
                  )}
                  
                  {/* Message bubble with reaction trigger */}
                  <div className="relative group">
                    <div className="flex items-end gap-2">
                      <div className={`rounded-xl px-4 py-2 max-w-xs md:max-w-md break-words ${
                        message.isDeleted
                          ? 'bg-gray-100 dark:bg-gray-800 opacity-75'
                          : isSentMessage
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-black dark:text-gray-100'
                      }`}>
                        {message.isDeleted ? (
                          <p className="text-sm leading-relaxed italic text-gray-500 dark:text-gray-400">
                            This message was deleted
                          </p>
                        ) : (
                          <p className="text-sm leading-relaxed">
                            {message.content}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs whitespace-nowrap flex-shrink-0 ${
                        isSentMessage ? 'text-gray-500 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {formatMessageTimestamp(message.createdAt)}
                      </span>
                    </div>

                    {/* Interaction buttons - only show if message is not deleted */}
                    {!message.isDeleted && (
                      <>
                        {/* Reaction trigger button (appears on hover) */}
                        <button
                          onClick={() => setShowReactionPicker(
                            showReactionPicker === message._id ? null : message._id
                          )}
                          className={`reaction-picker-container absolute ${isSentMessage ? 'right-0' : 'left-0'} -top-3 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out hover:scale-110 active:scale-95 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-md border border-gray-200 dark:border-gray-700`}
                          aria-label="Add reaction"
                        >
                          <Smile className="w-4 h-4" />
                        </button>

                        {/* Delete menu button (only for own messages) */}
                        {isSentMessage && (
                          <button
                            onClick={() => setShowDeleteMenu(
                              showDeleteMenu === message._id ? null : message._id
                            )}
                            className={`delete-menu-container absolute ${isSentMessage ? 'right-0' : 'left-0'} -top-3 ${isSentMessage ? '-right-8' : '-left-8'} opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out hover:scale-110 active:scale-95 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-md border border-gray-200 dark:border-gray-700`}
                            aria-label="More options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}

                    {/* Delete menu dropdown */}
                    {showDeleteMenu === message._id && isSentMessage && !message.isDeleted && (
                      <div className={`delete-menu-container absolute ${isSentMessage ? 'right-0' : 'left-0'} ${isSentMessage ? '-right-8' : '-left-8'} top-8 z-10 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden min-w-[140px]`}>
                        <button
                          onClick={() => handleDeleteMessage(message._id)}
                          className="w-full px-4 py-2 text-left text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}

                    {/* Reaction picker popup */}
                    {showReactionPicker === message._id && (
                      <div className={`reaction-picker-container absolute ${isSentMessage ? 'right-0' : 'left-0'} -top-14 z-10 flex gap-2 bg-white dark:bg-gray-800 shadow-md rounded-full px-3 py-2 border border-gray-200 dark:border-gray-700`}>
                        {REACTION_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleReactionClick(message._id, emoji)}
                            className="text-xl hover:scale-125 active:scale-95 transition-transform duration-150 ease-out"
                            aria-label={`React with ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Display existing reactions */}
                    {message.reactions && message.reactions.length > 0 && (
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {message.reactions.map((reaction) => {
                          const userReacted = reaction.users.includes(currentUser.id);
                          return (
                            <button
                              key={reaction.emoji}
                              onClick={() => !message.isDeleted && handleReactionClick(message._id, reaction.emoji)}
                              disabled={message.isDeleted}
                              className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-all duration-150 ease-out ${
                                message.isDeleted 
                                ? 'cursor-default opacity-60'
                                : 'cursor-pointer hover:scale-105 active:scale-95'
                              } ${
                                userReacted
                                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/60'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              <span>{reaction.emoji}</span>
                              <span className="font-medium">{reaction.users.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {isNewMessage && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400 animate-fadeInUp mt-1">
                      <Bell className="w-3 h-3" />
                      New
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} className="h-0" />
      </div>

      {/* Floating "New Messages" button */}
      {showNewMessagesButton && (
        <div className="sticky bottom-4 left-0 right-0 flex justify-center pointer-events-none">
          <Button
            onClick={scrollToBottom}
            className="pointer-events-auto shadow-lg hover:shadow-xl transition-all gap-2 bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <ArrowDown className="w-4 h-4" />
            {unreadCount > 0 ? `${unreadCount} New message${unreadCount > 1 ? 's' : ''}` : 'New messages'}
          </Button>
        </div>
      )}
    </div>
  );
}
