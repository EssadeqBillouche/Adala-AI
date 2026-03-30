"use client";

import React from "react";

interface ChatMessageProps {
  children: React.ReactNode;
  variant: "ai" | "user";
  timestamp: string;
  senderName: string;
  avatar?: React.ReactNode;
}

export default function ChatMessage({
  children,
  variant,
  timestamp,
  senderName,
  avatar,
}: ChatMessageProps) {
  const isUser = variant === "user";

  return (
    <div className={`flex gap-4 mb-8 ${isUser ? "justify-end" : ""}`}>
      {!isUser && avatar}
      
      <div className={`flex-1 ${isUser ? "max-w-2xl flex flex-col items-end" : ""}`}>
        <div className={`flex items-center gap-2 mb-2 ${isUser ? "flex-row-reverse" : ""}`}>
          <span className={`font-serif font-semibold ${isUser ? "text-on-surface" : "text-primary"}`}>
            {senderName}
          </span>
          <span className="text-sm text-gray-400">{timestamp}</span>
        </div>
        
        {children}
      </div>
      
      {isUser && avatar}
    </div>
  );
}
