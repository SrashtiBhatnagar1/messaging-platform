import type { ReactNode } from "react";

export type Message = {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  senderName?: string | null;
  senderEmail?: string | null;
  senderFirstName?: string | null;
  senderLastName?: string | null;
  isDeleted?: boolean;
  deletedAt?: number;
  reactions?: Array<{
    emoji: string;
    users: string[];
  }>;
};

export type Conversation = {
  _id: string;
  participantIds: string[];
  createdAt: number;
  lastMessageAt: number;
  name?: string | null;  // Group name, null for 1-1 chats
  isGroup?: boolean;     // true for groups, false/undefined for 1-1
  lastMessagePreview?: string;
  lastMessageSender?: string;
};

export type User = {
  id: string;
  email?: string;
  primaryEmailAddress?: {
    emailAddress: string;
  };
  username?: string;
  imageUrl?: string;
};

export interface ChatContextType {
  messages: Message[];
  conversationId: string | null;
  isLoading: boolean;
  isSending: boolean;
  sendMessage: (content: string) => Promise<void>;
}

export interface DashboardProps {
  children?: ReactNode;
}

export interface GroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (groupName: string, memberIds: string[]) => Promise<void>;
  availableUsers: User[];
  isLoading?: boolean;
}
