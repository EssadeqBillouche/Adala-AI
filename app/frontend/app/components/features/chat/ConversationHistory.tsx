"use client";

import React, { useState, useEffect } from "react";
import { api, type Conversation } from "../../../lib/api";

interface ConversationHistoryProps {
  currentConversationId?: string;
  onConversationSelect: (conversation: Conversation) => void;
  onNewConversation: () => void;
}

export default function ConversationHistory({
  currentConversationId,
  onConversationSelect,
  onNewConversation,
}: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const convs = await api.getConversations();
        // Filter only active conversations and sort by most recent
        const activeConvs = convs
          .filter((c) => c.status === "ACTIVE")
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setConversations(activeConvs);
      } catch (error) {
        console.error("Failed to load conversations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  if (isLoading) {
    return (
      <div className="px-3 py-2">
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-surface-container-high rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
      {conversations.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-sm text-gray-500">No conversations yet</p>
          <p className="text-xs text-gray-400 mt-1">Start a new consultation to begin</p>
        </div>
      ) : (
        <>
          <div className="px-2 py-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recent Conversations</p>
          </div>
          {conversations.map((conv) => {
            const isActive = conv.id === currentConversationId;
            return (
              <button
                key={conv.id}
                onClick={() => onConversationSelect(conv)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  isActive
                    ? "bg-secondary-container/50 text-secondary"
                    : "text-gray-600 hover:bg-surface-container-high hover:text-on-surface"
                }`}
              >
                <div className="flex items-start gap-2">
                  <svg
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      isActive ? "text-secondary" : "text-gray-400 group-hover:text-gray-500"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conv.title || "Untitled Conversation"}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(conv.updatedAt)}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}
