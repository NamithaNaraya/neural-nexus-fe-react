import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Sparkles, RotateCcw, FileText, Download, History } from 'lucide-react';
import { MessageBubble, TypingIndicator } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ChatToolbar } from './ChatToolbar';
import { ChatHistoryPanel } from './ChatHistoryPanel';
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
  const [chatHistory, setChatHistory] = useState([]);
  const [isHistoryOpen, setHistoryOpen] = useState(true);
  const [sessionName, setSessionName] = useState('Session');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const createSessionSnapshot = () => ({
    id: Date.now().toString(),
    label: `${sessionName} ${chatHistory.length + 1}`,
    createdAt: Date.now(),
    messages: messages.slice(),
  });

  const saveCurrentSession = () => {
    if (messages.length <= 1) return;
    setChatHistory((prev) => [...prev, createSessionSnapshot()]);
  };

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
    saveCurrentSession();
    setMessages([{ role: 'assistant', content: 'Chat cleared. How can I help you?' }]);
  };

  const exportToText = () => {
    const text = messages
      .map((m) => `[${m.role.toUpperCase()}] ${m.content}`)
      .join('\n\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `rag-chat-${Date.now()}.txt`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };

  const exportToJson = () => {
    const json = JSON.stringify({ folder: currentFolder?.name || 'global', createdAt: new Date().toISOString(), messages }, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `rag-chat-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };

  const restoreSession = (id) => {
    const session = chatHistory.find((item) => item.id === id);
    if (session) {
      setMessages(session.messages);
      setHistoryOpen(false);
    }
  };

  const deleteSession = (id) => {
    setChatHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const readOnlyMessageCount = useMemo(() => messages.length, [messages]);

  return (
    <div className="flex h-[calc(100vh-theme(spacing.14)-theme(spacing.12))] flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="gradient-text">AI Chat</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              {currentFolder?.name
                ? `Combined RAG Pipeline - scoped to ${currentFolder.name}`
                : 'Combined RAG Pipeline - choose a folder in the header'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => setHistoryOpen((v) => !v)}>
              <History className="h-4 w-4" />
              {isHistoryOpen ? 'Collapse History' : 'Open History'}
            </Button>
            <Button variant="outline" size="sm" onClick={clearChat} className="gap-1">
              <RotateCcw className="h-4 w-4" />
              Clear Chat
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium">Messages:</span>
          <span className="rounded-full bg-muted/40 px-2 py-0.5">{readOnlyMessageCount}</span>
        </div>
      </div>

      <ChatToolbar
        onClear={clearChat}
        onExportText={exportToText}
        onExportJson={exportToJson}
        onToggleHistory={() => setHistoryOpen((prev) => !prev)}
        isHistoryOpen={isHistoryOpen}
        onScrollBottom={scrollToBottom}
        loading={loading}
      />

      <div className="flex flex-1 gap-4 overflow-hidden">
        <Card className="flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted/50">
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

        {isHistoryOpen && (
          <div className="w-[280px] overflow-hidden">
            <ChatHistoryPanel
              history={chatHistory}
              onRestore={restoreSession}
              onDelete={deleteSession}
            />
          </div>
        )}
      </div>
    </div>
  );
}
