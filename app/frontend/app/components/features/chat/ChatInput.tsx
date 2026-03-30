"use client";

import React, { useState, useRef, useEffect } from "react";
import BrassButton from "../../design/BrassButton";

interface ChatInputProps {
  placeholder?: string;
  onSend?: (message: string) => void;
  onAttach?: () => void;
  disabled?: boolean;
}

export default function ChatInput({
  placeholder = "Type your legal inquiry here...",
  onSend,
  onAttach,
  disabled = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && onSend) {
      onSend(message.trim());
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="p-6 bg-surface border-t border-surface-container-high">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end gap-3 bg-surface-container-lowest rounded-xl p-2 shadow-float ring-1 ring-surface-dim focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
            <button
              type="button"
              onClick={onAttach}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:bg-surface-container-high hover:text-secondary transition-all duration-200 shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label="Attach file"
              disabled={disabled}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="flex-1 bg-transparent border-none focus:outline-none resize-none py-3 px-2 max-h-32 min-h-[48px] text-on-surface placeholder-gray-400 disabled:opacity-50 text-base leading-relaxed"
              aria-label="Message input"
            />
            
            <BrassButton
              type="submit"
              variant="primary"
              disabled={disabled || !message.trim()}
              className="shrink-0"
              aria-label="Send message"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </BrassButton>
          </div>
        </form>
        
        <p className="label-sm text-center text-gray-400 mt-4" role="note">
          AI ASSISTANCE IS FOR INFORMATIONAL PURPOSES. CONSULT A LICENSED MOROCCAN BARRISTER FOR OFFICIAL LEGAL ACTION.
        </p>
      </div>
    </div>
  );
}
