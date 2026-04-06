"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import { ChatLayout, type Message, type Action } from "../components/features/chat";
import { api, type Conversation, type CreateMessageRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";

function ConsultAIContent() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load or create conversation on mount
  useEffect(() => {
    const initConversation = async () => {
      try {
        const conversations = await api.getConversations();

        if (conversations.length > 0) {
          setConversation(conversations[0]);
          const msgs = await api.getMessages(conversations[0].id);
          setMessages(msgs.map(msg => ({
            id: msg.id,
            type: msg.role === "USER" ? "user" : "ai" as const,
            content: msg.content,
            timestamp: new Date(msg.createdAt).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true
            }),
            senderName: msg.role === "ASSISTANT" ? "Majlis Counsel" : undefined,
          })));
        } else {
          const projects = await api.getProjects();
          let projectId: string | undefined = projects[0]?.id;

          if (!projectId) {
            const newProject = await api.createProject({ title: "My First Case" });
            projectId = newProject.id;
          }

          if (!projectId) {
            console.error("Failed to obtain a valid project ID");
            return;
          }

          const newConversation = await api.createConversation({
            title: "Legal Consultation",
            projectId,
            language: "EN",
          });
          setConversation(newConversation);
        }
      } catch (error) {
        console.error("Failed to initialize conversation:", error);
      }
    };

    initConversation();
  }, []);

  const handleConversationSelect = async (selectedConversation: Conversation) => {
    // Cancel any ongoing streaming request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setConversation(selectedConversation);
    setIsLoading(true);
    setMessages([]);
    setShowTyping(false);

    try {
      const msgs = await api.getMessages(selectedConversation.id);
      setMessages(msgs.map(msg => ({
        id: msg.id,
        type: msg.role === "USER" ? "user" : "ai" as const,
        content: msg.content,
        timestamp: new Date(msg.createdAt).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        }),
        senderName: msg.role === "ASSISTANT" ? "Majlis Counsel" : undefined,
      })));
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!conversation || !message.trim()) return;

    // Cancel any ongoing streaming request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setShowTyping(true);

    // Unique ID for the streaming AI message
    const aiMessageId = `ai-${Date.now()}`;

    try {
      // Add user message to UI immediately
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        type: "user",
        content: message,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        }),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Send user message to backend (fire and forget — don't block streaming)
      const messageData: CreateMessageRequest = {
        role: "USER",
        content: message,
        conversationId: conversation.id,
      };
      api.createMessage(messageData).catch(err => console.error("Failed to save user message:", err));

      // Create a placeholder AI message that will be updated incrementally
      const placeholderAiMessage: Message = {
        id: aiMessageId,
        type: "ai",
        content: "",
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        }),
        senderName: "Majlis Counsel",
      };
      setMessages((prev) => [...prev, placeholderAiMessage]);

      // Start streaming from the AI engine
      let fullAnswer = "";
      let hasReceivedContent = false;

      for await (const event of api.streamAsk(
        { question: message, conversationId: conversation.id },
        abortController.signal
      )) {
        if (event.type === "documents") {
          // Documents retrieved — still in thinking phase
          setShowTyping(true);
        } else if (event.type === "answer_chunk") {
          // First chunk arrives — hide typing indicator
          if (!hasReceivedContent) {
            hasReceivedContent = true;
            setShowTyping(false);
          }
          fullAnswer += event.content || "";
          // Update the AI message incrementally
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId ? { ...msg, content: fullAnswer } : msg
            )
          );
        } else if (event.type === "error") {
          setShowTyping(false);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: `Error: ${event.error || "Unknown error occurred"}` }
                : msg
            )
          );
          break;
        } else if (event.type === "end") {
          setShowTyping(false);
          break;
        }
      }

      // Save the complete AI response to the backend
      if (fullAnswer) {
        const aiMessageData: CreateMessageRequest = {
          role: "ASSISTANT",
          content: fullAnswer,
          conversationId: conversation.id,
        };
        await api.createMessage(aiMessageData).catch(err =>
          console.error("Failed to save AI message:", err)
        );
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Streaming aborted");
        return;
      }
      console.error("Failed to send message:", error);
      setShowTyping(false);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, content: `Error: ${error.message || "Failed to get response"}` }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleAttachFile = () => {
    console.log("Attaching file");
  };

  const handleActionClick = (actionId: string) => {
    console.log("Action clicked:", actionId);
  };

  // Show loading state while initializing
  if (!conversation && messages.length === 0) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-primary mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="label-sm text-gray-500">Initializing consultation...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <ChatLayout
        messages={messages}
        actions={[
          {
            id: "1",
            label: "LEGAL CODE",
            title: "Search Moroccan Penal Code",
            onClick: () => handleActionClick("1"),
          },
          {
            id: "2",
            label: "DOCUMENT",
            title: "Generate Legal Document",
            onClick: () => handleActionClick("2"),
          },
          {
            id: "3",
            label: "PRECEDENT",
            title: "Find Case Precedents",
            onClick: () => handleActionClick("3"),
          },
        ]}
        showTyping={showTyping}
        onSendMessage={handleSendMessage}
        onAttachFile={handleAttachFile}
        currentConversationId={conversation?.id}
        onConversationSelect={handleConversationSelect}
        caseContext={{
          reference: conversation?.id ? `MD-${conversation.id.slice(0, 8).toUpperCase()}` : "NEW",
          summary: "AI-powered legal consultation session. Ask questions about Moroccan law and get citations from official legal sources.",
          documents: [],
          legalFoundation: [
            { id: "1", title: "Moroccan Penal Code", description: "Criminal law and procedures", color: "primary" },
            { id: "2", title: "Code of Obligations", description: "Civil contracts and obligations", color: "secondary" },
          ],
        }}
      />
      <div ref={messagesEndRef} />
    </ProtectedRoute>
  );
}

export default function ConsultAIPage() {
  return <ConsultAIContent />;
}
