"use client";

import React from "react";
import TonalCard from "../../design/TonalCard";
import ChatMessage from "./ChatMessage";

interface AIMessageProps {
  content: React.ReactNode;
  timestamp: string;
  senderName?: string;
  avatar?: React.ReactNode;
}

export default function AIMessage({
  content,
  timestamp,
  senderName = "Majlis Counsel",
  avatar,
}: AIMessageProps) {
  const defaultAvatar = (
    <div className="w-12 h-12 rounded-lg gradient-hero flex items-center justify-center shrink-0 shadow-md">
      <svg className="w-6 h-6 text-on-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    </div>
  );

  return (
    <ChatMessage
      variant="ai"
      timestamp={timestamp}
      senderName={senderName}
      avatar={avatar || defaultAvatar}
    >
      <TonalCard className="p-6 mb-4" hover={false} padding="none">
        <div className="p-6">
          <p className="body-lg text-on-surface leading-relaxed">{content}</p>
        </div>
      </TonalCard>
    </ChatMessage>
  );
}
