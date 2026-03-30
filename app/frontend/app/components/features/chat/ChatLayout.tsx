"use client";

import React from "react";
import Sidebar from "../../Sidebar";
import ChatTopNav from "./ChatTopNav";
import DateDivider from "./DateDivider";
import AIMessage from "./AIMessage";
import UserMessage from "./UserMessage";
import TypingIndicator from "./TypingIndicator";
import ActionCards from "./ActionCards";
import ChatInput from "./ChatInput";
import CaseSidebar from "./CaseSidebar";

export interface Message {
  id: string;
  type: "ai" | "user";
  content: React.ReactNode;
  timestamp: string;
  senderName?: string;
}

export interface Action {
  id: string;
  label: string;
  title: string;
  onClick?: () => void;
}

interface ChatLayoutProps {
  messages?: Message[];
  actions?: Action[];
  showTyping?: boolean;
  onSendMessage?: (message: string) => void;
  onAttachFile?: () => void;
  caseContext?: {
    reference?: string;
    summary?: string;
    documents?: Array<{ id: string; fileName: string; uploadedAt: string }>;
    legalFoundation?: Array<{ id: string; title: string; description: string; color?: "primary" | "secondary" }>;
  };
}

export default function ChatLayout({
  messages = [
    {
      id: "1",
      type: "ai",
      content: (
        <>
          Good morning. I have reviewed the documents you uploaded regarding the property dispute in Marrakech. Based on the{" "}
          <strong className="font-serif">Moroccan Code of Obligations and Contracts</strong>, there are three primary articles that apply to your current situation. How would you like to proceed?
        </>
      ),
      timestamp: "09:41 AM",
      senderName: "Majlis Counsel",
    },
    {
      id: "2",
      type: "user",
      content: "Please explain Article 488 in the context of family-owned land that hasn't been formally registered in the Land Registry (Conservation Foncière) yet.",
      timestamp: "09:45 AM",
    },
  ],
  actions = [
    { id: "1", label: "ARTICLE 488", title: "Review Property Transfer Laws" },
    { id: "2", label: "PROCEDURAL", title: "Generate Draft Petition" },
  ],
  showTyping = true,
  onSendMessage,
  onAttachFile,
  caseContext,
}: ChatLayoutProps) {
  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <Sidebar variant="vertical" />

      {/* Main Content */}
      <main className="flex-1 ml-64 flex flex-col">
        <ChatTopNav />

        <div className="flex-1 flex overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <DateDivider date="OCTOBER 24, 2024" />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-8 pb-4 star-pattern">
              {messages.map((message) =>
                message.type === "ai" ? (
                  <AIMessage
                    key={message.id}
                    content={message.content}
                    timestamp={message.timestamp}
                    senderName={message.senderName}
                  />
                ) : (
                  <UserMessage
                    key={message.id}
                    content={message.content as string}
                    timestamp={message.timestamp}
                  />
                )
              )}

              {actions.length > 0 && (
                <div className="mb-8">
                  <ActionCards actions={actions} />
                </div>
              )}

              {showTyping && <TypingIndicator />}
            </div>

            {/* Input Area */}
            <ChatInput onSend={onSendMessage} onAttach={onAttachFile} />
          </div>

          {/* Right Sidebar - Case Context */}
          {caseContext && <CaseSidebar {...caseContext} />}
        </div>
      </main>
    </div>
  );
}
