'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';

// Types for our chat system
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  suggestedFollowUps?: string[];
  timestamp: Date;
}

export interface Source {
  id: string;
  type: 'lecture' | 'resource';
  title: string;
  text: string;
  timestamp?: string;
  url?: string;
  similarity: number;
  metadata: Record<string, any>;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
  suggestedFollowUps?: string[];
}

export function ChatInterface() {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (query: string) => {
    if (!query.trim()) return;

    // Add user message immediately
    const userMsg: Message = { 
      role: 'user', 
      content: query, 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      // Prepare context (last 10 messages, exclude sources for API)
      const context = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      // Call API with context and authentication
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ query, context })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data: ChatResponse = await response.json();

      // Add bot response
      const botMsg: Message = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        suggestedFollowUps: data.suggestedFollowUps,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      
      // Add error message to chat
      const errorMsg: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, session]);

  const clearHistory = useCallback(() => {
    if (confirm('Clear chat history?')) {
      setMessages([]);
      setError(null);
    }
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Ask me anything about your cohort's curriculum</h2>
          <p className="text-sm text-gray-500">Get instant answers with timestamped citations from lectures and resources</p>
        </div>
        <button
          onClick={clearHistory}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
        >
          Clear History
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={messages} 
          isLoading={isLoading}
          error={error}
          onFollowUpClick={sendMessage}
        />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <ChatInput 
          onSubmit={sendMessage}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}
