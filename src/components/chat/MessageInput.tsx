"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Smile } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { Id } from "../../../convex/_generated/dataModel";

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  disabled: boolean;
  isSending: boolean;
  conversationId: Id<"conversations"> | null;
}

export function MessageInput({
  onSendMessage,
  disabled,
  isSending,
  conversationId,
}: MessageInputProps) {
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  
  const { handleTyping, handleStopTyping } = useTypingIndicator(conversationId);

  // Handle click outside emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showEmojiPicker]);

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!messageText.trim() || disabled) {
      return;
    }

    try {
      setIsLoading(true);
      handleStopTyping(); // Clear typing indicator when sending
      await onSendMessage(messageText);
      setMessageText("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    handleTyping(); // Update typing indicator
  };

  const handleEmojiClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleEmojiSelect = (emojiObject: { emoji: string }) => {
    const newText = messageText + emojiObject.emoji;
    setMessageText(newText);
    setShowEmojiPicker(false);
    
    // Focus input and set cursor to end
    if (inputRef.current) {
      inputRef.current.focus();
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(newText.length, newText.length);
        }
      }, 0);
    }
  };

  return (
    <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0 transition-colors duration-300">
      <form
        onSubmit={handleSubmit}
        className="max-w-4xl mx-auto"
      >
        <div className="relative">
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-14 left-0 z-50 shadow-lg rounded-lg overflow-hidden"
            >
              <EmojiPicker
                onEmojiClick={handleEmojiSelect}
                height={350}
                width={300}
              />
            </div>
          )}

          {/* Input Container */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-blue-400 dark:focus-within:ring-blue-500 transition-all duration-200 ease-out">
            {/* Emoji Button */}
            <button
              type="button"
              onClick={handleEmojiClick}
              className={`text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-full transition-all duration-200 ease-out hover:scale-110 active:scale-95 ${
                showEmojiPicker ? "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300" : ""
              }`}
              disabled={disabled || isLoading || isSending}
              aria-label="Add emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Text Input */}
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a message..."
              value={messageText}
              onChange={handleInputChange}
              disabled={disabled || isLoading || isSending}
              className="flex-1 bg-transparent outline-none px-2 py-2 text-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 disabled:opacity-50"
              autoFocus
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={
                !messageText.trim() ||
                disabled ||
                isLoading ||
                isSending
              }
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-full p-2 flex items-center justify-center transition-all duration-200 ease-out hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:hover:scale-100"
              aria-label="Send message"
            >
              {isLoading || isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
