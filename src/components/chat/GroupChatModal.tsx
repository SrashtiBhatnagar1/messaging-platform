"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

interface User {
  clerkId: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}

interface GroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (groupName: string, memberIds: string[]) => Promise<void>;
  availableUsers: User[];
  isLoading?: boolean;
}

export function GroupChatModal({
  isOpen,
  onClose,
  onCreateGroup,
  availableUsers,
  isLoading = false,
}: GroupChatModalProps) {
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMemberToggle = (userId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedMembers(newSelected);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert("Please enter a group name");
      return;
    }

    if (selectedMembers.size < 2) {
      alert("Please select at least 2 members");
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateGroup(groupName, Array.from(selectedMembers));
      setGroupName("");
      setSelectedMembers(new Set());
      onClose();
    } catch (error) {
      console.error("Failed to create group:", error);
      alert("Failed to create group. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Group Chat</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Group Name Input */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Group Name
            </label>
            <Input
              placeholder="e.g., Study Group"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              disabled={isSubmitting || isLoading}
              className="mt-1"
            />
          </div>

          {/* Members Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Members ({selectedMembers.size}/10)
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Select at least 2 members
            </p>
            <ScrollArea className="h-64 border border-gray-200 dark:border-gray-700 rounded-md p-2">
              <div className="space-y-2">
                {availableUsers.map((user) => (
                  <div
                    key={user.clerkId}
                    className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => handleMemberToggle(user.clerkId)}
                  >
                    <Checkbox
                      checked={selectedMembers.has(user.clerkId)}
                      onChange={() => handleMemberToggle(user.clerkId)}
                      disabled={isSubmitting || isLoading}
                      className="cursor-pointer"
                    />
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={user.imageUrl} alt={user.username || "User"} />
                      <AvatarFallback className="bg-blue-400 text-white text-xs">
                        {(user.firstName?.[0] || "") + (user.lastName?.[0] || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {user.firstName || user.lastName
                          ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                          : user.username || "User"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting || isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={
                isSubmitting ||
                isLoading ||
                !groupName.trim() ||
                selectedMembers.size < 2
              }
              className="gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Group
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
