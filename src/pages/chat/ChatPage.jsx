import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MessageSquare, Sparkles, RotateCcw } from 'lucide-react';
import { MessageBubble, TypingIndicator } from './MessageBubble';
import { ChatInput } from './ChatInput';
import api from '../../services/api';

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: "Hello! I'm your AI-powered knowledge graph assistant. Ask me anything about your data — I use RAG (Retrieval-Augmented Generation) to find answers directly from your knowledge graph.",
};

export default function ChatPage() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content }));

      const response = await api.post('/combined-chat/answer', {
        question: userMessage,
        folder_id: null,
        history: history.slice(-6),
      });

      const answer = response.data?.answer || response.data?.response || 'I could not generate a response.';
      const sources = response.data?.sources || response.data?.context_nodes || [];

      setMessages(prev => [...prev, { role: 'assistant', content: answer, sources }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure the backend is running and try again.',
        isError: true,
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: 'Chat cleared. How can I help you?' }]);
  };

  return (
    <div className="h-[calc(100vh-theme(spacing.14)-theme(spacing.12))] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="gradient-text">AI Chat</span>
          </h1>
          <p className="text-muted-foreground text-sm flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Combined RAG Pipeline — Knowledge-aware AI
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={clearChat} className="gap-2">
          <RotateCcw className="w-3.5 h-3.5" />
          Clear
        </Button>
      </div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}
          {loading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={sendMessage}
          loading={loading}
          inputRef={inputRef}
        />
      </Card>
    </div>
  );
}
