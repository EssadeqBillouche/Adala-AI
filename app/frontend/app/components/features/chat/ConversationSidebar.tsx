"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../design/Avatar";
import Label from "../design/Label";
import { api, type Conversation } from "../../lib/api";

interface ConversationSidebarProps {
  currentConversationId?: string;
  onConversationSelect: (conversation: Conversation) => void;
}

export default function ConversationSidebar({
  currentConversationId,
  onConversationSelect,
}: ConversationSidebarProps) {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
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

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  const handleNewConversation = () => {
    // Reload the page to create a new conversation
    window.location.reload();
  };

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

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low z-40 flex flex-col shadow-elevated" role="navigation" aria-label="Conversation navigation">
      {/* Logo */}
      <div className="p-6 pb-4">
        <Link href="/dashboard" className="block group">
          <h1 className="font-serif text-xl font-semibold text-primary group-hover:text-primary-container transition-colors duration-200">
            Majlis Digital
          </h1>
          <p className="label-sm text-gray-500 mt-1.5">
            MOROCCAN LEGAL PORTAL
          </p>
        </Link>
      </div>

      {/* New Conversation Button */}
      <div className="px-4 pb-3">
        <button
          onClick={handleNewConversation}
          className="btn-primary w-full justify-center flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Consultation
        </button>
      </div>

      {/* Conversation History */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recent Conversations</p>
        </div>
        
        <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-1">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-surface-container-high rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-xs text-gray-500">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => {
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
            })
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 space-y-3 border-t border-surface-dim">
        <div className="pt-2">
          <button className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-gray-500 hover:bg-surface-container-high hover:text-on-surface transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <Label size="sm">HELP CENTER</Label>
          </button>
        </div>

        {/* User Profile */}
        {isAuthenticated && user && (
          <div className="pt-2 border-t border-surface-dim">
            <div className="flex items-center gap-3 px-2">
              <Avatar
                initials={`${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`}
                variant="secondary"
                size="sm"
                alt={`${user.firstName} ${user.lastName}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-gray-400 hover:bg-surface-container-high hover:text-error transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-error/20"
          aria-label="Log out"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <Label size="sm">LOGOUT</Label>
        </button>
      </div>
    </aside>
  );
}
