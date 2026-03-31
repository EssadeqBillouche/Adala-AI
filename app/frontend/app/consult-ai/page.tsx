"use client";

import { useState, useEffect, useRef } from "react";
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

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load or create conversation on mount
  useEffect(() => {
    const initConversation = async () => {
      try {
        // Try to get existing conversations (you might want to filter by project)
        const conversations = await api.getConversations();
        
        if (conversations.length > 0) {
          // Use existing conversation
          setConversation(conversations[0]);
          // Load messages for this conversation
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
          // Create new conversation (you'll need a project first)
          // For now, we'll create one with a default project
          const projects = await api.getProjects();
          let projectId = projects[0]?.id;
          
          if (!projectId) {
            // Create a default project if none exists
            const newProject = await api.createProject({ title: "My First Case" });
            projectId = newProject.id;
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

  const handleSendMessage = async (message: string) => {
    if (!conversation || !message.trim()) return;

    setIsLoading(true);
    setShowTyping(true);

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

      // Send user message to backend
      const messageData: CreateMessageRequest = {
        role: "USER",
        content: message,
        conversationId: conversation.id,
      };
      await api.createMessage(messageData);

      // Simulate AI response (in production, this would call your AI service)
      // For now, we'll create a placeholder AI response
      setTimeout(async () => {
        const aiResponse: Message = {
          id: `ai-${Date.now()}`,
          type: "ai",
          content: "Thank you for your question. Based on Moroccan law, I'm analyzing your request. In a production environment, this would connect to an AI service trained on Moroccan legal codes.",
          timestamp: new Date().toLocaleTimeString("en-US", { 
            hour: "numeric", 
            minute: "2-digit", 
            hour12: true 
          }),
          senderName: "Majlis Counsel",
        };
        
        setMessages((prev) => [...prev, aiResponse]);
        setShowTyping(false);

        // Save AI response to backend
        const aiMessageData: CreateMessageRequest = {
          role: "ASSISTANT",
          content: aiResponse.content as string,
          conversationId: conversation.id,
        };
        await api.createMessage(aiMessageData);
      }, 1500);
    } catch (error) {
      console.error("Failed to send message:", error);
      setShowTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttachFile = () => {
    console.log("Attaching file");
    // TODO: Implement file upload - would need additional backend endpoint
  };

  const handleActionClick = (actionId: string) => {
    console.log("Action clicked:", actionId);
    // TODO: Handle action clicks - could trigger specific AI queries or templates
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
