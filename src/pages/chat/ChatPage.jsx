import React, { useEffect, useRef, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Sparkles, RotateCcw } from 'lucide-react';
import { MessageBubble, TypingIndicator } from './MessageBubble';
import { ChatInput } from './ChatInput';
import api from '../../services/api';
import { useGlobalFolder } from '../../contexts/GlobalFolderContext';

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: "Hello! I'm your AI-powered knowledge graph assistant. Ask me anything about your data - I use RAG (Retrieval-Augmented Generation) to find answers directly from your knowledge graph.",
};

export default function ChatPage() {
  const { currentFolder, selectedFolderId } = useGlobalFolder();
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
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const history = messages
        .filter((message) => message.role !== 'system')
        .map((message) => ({ role: message.role, content: message.content }));

      const response = await api.post('/combined-chat/answer', {
        question: userMessage,
        folder_id: selectedFolderId || null,
        history: history.slice(-6),
      });

      const answer = response.data?.answer || response.data?.response || 'I could not generate a response.';
      const sources = response.data?.sources || response.data?.context_nodes || [];

      setMessages((prev) => [...prev, { role: 'assistant', content: answer, sources }]);
    } catch {
      setMessages((prev) => [...prev, {
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
    <div className="flex h-[calc(100vh-theme(spacing.14)-theme(spacing.12))] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="gradient-text">AI Chat</span>
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {currentFolder?.name
              ? `Combined RAG Pipeline - scoped to ${currentFolder.name}`
              : 'Combined RAG Pipeline - choose a folder in the header'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={clearChat} className="gap-2">
          <RotateCcw className="h-3.5 w-3.5" />
          Clear
        </Button>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 scroll-smooth">
          {messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))}
          {loading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

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
