import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format message timestamp with smart rules:
 * - Today: Just time (2:34 PM)
 * - Earlier this year: Month Day, Time (Feb 15, 2:34 PM)
 * - Previous years: Month Day, Year, Time (Feb 15, 2023, 2:34 PM)
 */
export function formatMessageTimestamp(timestamp: number): string {
  const messageDate = new Date(timestamp);
  const now = new Date();
  
  const isToday = 
    messageDate.getDate() === now.getDate() &&
    messageDate.getMonth() === now.getMonth() &&
    messageDate.getFullYear() === now.getFullYear();
  
  const isSameYear = messageDate.getFullYear() === now.getFullYear();
  
  if (isToday) {
    // Today: Just time (2:34 PM)
    return messageDate.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } else if (isSameYear) {
    // Earlier this year: Feb 15, 2:34 PM
    return messageDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } else {
    // Previous years: Feb 15, 2023, 2:34 PM
    return messageDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
}

/**
 * Format conversation timestamp for sidebar - short format:
 * - Today: time only (2:34 PM)
 * - Yesterday: "Yesterday"
 * - This week: day name (Mon, Tue)
 * - Otherwise: short date (Mar 2) or with year if different year (3/2/25)
 */
export function formatConversationTime(timestamp: number): string {
  const msgDate = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDateOnly = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());

  const diffTime = today.getTime() - msgDateOnly.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Today: just time (2:34 PM)
    return msgDate.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } else if (diffDays === 1) {
    // Yesterday
    return 'Yesterday';
  } else if (diffDays < 7) {
    // This week: day name (Mon, Tue, etc.)
    return msgDate.toLocaleString('en-US', { weekday: 'short' });
  } else if (msgDate.getFullYear() === now.getFullYear()) {
    // This year: short date (Mar 2)
    return msgDate.toLocaleString('en-US', { month: 'short', day: 'numeric' });
  } else {
    // Different year: 3/2/25
    return msgDate.toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
  }
}
