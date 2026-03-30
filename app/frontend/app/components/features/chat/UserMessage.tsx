"use client";

import React from "react";
import TonalCard from "../../design/TonalCard";
import Avatar from "../../design/Avatar";
import ChatMessage from "./ChatMessage";

interface UserMessageProps {
  content: string;
  timestamp: string;
  senderName?: string;
  userInitials?: string;
}

export default function UserMessage({
  content,
  timestamp,
  senderName = "You",
  userInitials = "JD",
}: UserMessageProps) {
  const avatar = (
    <Avatar
      initials={userInitials}
      variant="secondary"
      size="lg"
    />
  );

  return (
    <ChatMessage
      variant="user"
      timestamp={timestamp}
      senderName={senderName}
      avatar={avatar}
    >
      <TonalCard className="p-6 bg-surface-container-lowest" hover={false}>
        <p className="body-lg text-on-surface">{content}</p>
      </TonalCard>
    </ChatMessage>
  );
}
