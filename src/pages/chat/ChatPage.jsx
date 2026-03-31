import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { RotateCcw, History } from 'lucide-react';
import { MessageBubble, TypingIndicator } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ChatToolbar } from './ChatToolbar';
import { ChatHistoryPanel } from './ChatHistoryPanel';
import api from '../../services/api';
import { useGlobalFolder } from '../../contexts/GlobalFolderContext';

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: "Hello! I'm your AI chat assistant with RAG and web search. Ask anything about your knowledge graph or general domain, and you'll get full answers from the backend.",
};

export default function ChatPage() {
  const { currentFolder, selectedFolderId } = useGlobalFolder();
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isHistoryOpen, setHistoryOpen] = useState(true);
  const [sessionName, setSessionName] = useState('Chat Session');
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

  const normalizeWebSearchSources = (metadata) => {
    const chunks = metadata?.grounding_chunks || [];
    return chunks
      .map((chunk) => {
        const source = chunk?.web || chunk;
        const title = source?.title || source?.source || source?.name || 'Source';
        const url = source?.uri || source?.url || '';
        if (!url) return null;
        return {
          title,
          url,
          snippet: source?.snippet || source?.description || '',
        };
      })
      .filter(Boolean);
  };

  const updateMessageAtIndex = (index, updater) => {
    setMessages((prev) => prev.map((message, messageIndex) => (messageIndex === index ? updater(message) : message)));
  };

  const performWebSearch = async ({ question, contextHint = '', messageIndex = null, appendMessage = false }) => {
    const searchQuery = (question || '').trim();
    if (!searchQuery) return;

    const fallbackContext = contextHint || currentFolder?.name || 'general';
    let appendedMessageIndex = null;

    if (typeof messageIndex === 'number') {
      updateMessageAtIndex(messageIndex, (message) => ({
        ...message,
        webSearchPending: true,
        webSearchQuery: searchQuery,
        webSearchContextHint: fallbackContext,
        isWebSearch: true,
      }));
    } else if (appendMessage) {
      setMessages((prev) => {
        appendedMessageIndex = prev.length;
        return [
          ...prev,
          {
            role: 'assistant',
            content: `Searching web for: "${searchQuery}"...`,
            isWebSearch: true,
            webSearchPending: true,
            webSearchQuery: searchQuery,
            webSearchContextHint: fallbackContext,
          },
        ];
      });
    }

    setLoading(true);

    try {
      const response = await api.post('/combined-chat/web-search', {
        question: searchQuery,
        context_hint: fallbackContext,
      });

      const answer = response.data?.answer || response.data?.response || 'No results found from web search.';
      const sources = normalizeWebSearchSources(response.data?.grounding_metadata);

      if (typeof messageIndex === 'number') {
        updateMessageAtIndex(messageIndex, (message) => ({
          ...message,
          webSearchPending: false,
          webSearchAnswer: answer,
          webSearchSources: sources,
          isWebSearch: true,
          webSearchQuery: searchQuery,
          webSearchContextHint: fallbackContext,
        }));
      } else if (appendMessage && typeof appendedMessageIndex === 'number') {
        updateMessageAtIndex(appendedMessageIndex, (message) => ({
          ...message,
          content: `Web search results for "${searchQuery}"`,
          webSearchPending: false,
          webSearchAnswer: answer,
          webSearchSources: sources,
          isWebSearch: true,
          webSearchQuery: searchQuery,
          webSearchContextHint: fallbackContext,
        }));
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Web search results for "${searchQuery}"`,
            isWebSearch: true,
            webSearchPending: false,
            webSearchAnswer: answer,
            webSearchSources: sources,
            webSearchQuery: searchQuery,
            webSearchContextHint: fallbackContext,
          },
        ]);
      }
    } catch {
      const errorMessage = {
        role: 'assistant',
        content: 'Web search failed. Please try again.',
        isError: true,
        isWebSearch: true,
        webSearchPending: false,
        webSearchQuery: searchQuery,
        webSearchContextHint: fallbackContext,
      };

      if (typeof messageIndex === 'number') {
        updateMessageAtIndex(messageIndex, (message) => ({
          ...message,
          ...errorMessage,
        }));
      } else {
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setLoading(false);
    }
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

      // Call non-streaming endpoint that returns full response
      const response = await api.post('/combined-chat/answer', {
        question: userMessage,
        folder_id: selectedFolderId || null,
        history: history.slice(-6),
      });

      console.log('Full API response:', response.data);

      // Extract all fields from the response
      const answer = response.data?.answer || response.data?.response || 'I could not generate a response.';
      const sources = response.data?.sources || response.data?.context_nodes || [];
      const suggestWebSearch = response.data?.suggest_web_search ?? response.data?.web_search_emphasized ?? true;
      const contextSummary = response.data?.context_summary || '';
      const intent = response.data?.intent || {};
      const algorithm = response.data?.algorithm || null;
      const results = response.data?.results || null;
      const webSearchQuery = response.data?.web_search_query || userMessage;
      const webSearchSources = normalizeWebSearchSources(response.data?.grounding_metadata);

      // Add complete message with all data
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: answer,
        sources,
        webSearchSuggested: suggestWebSearch,
        webSearchQuery,
        webSearchSources,
        contextSummary,
        intent,
        algorithm,
        results,
      }]);

    } catch (error) {
      console.error('Chat error', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please make sure the backend is running and try again.',
          isError: true,
        },
      ]);
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
    const text = messages.map((m) => `[${m.role.toUpperCase()}] ${m.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `chat-${Date.now()}.txt`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };

  const exportToJson = () => {
    const json = JSON.stringify({ folder: currentFolder?.name || 'global', createdAt: new Date().toISOString(), messages }, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `chat-${Date.now()}.json`;
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
    <div className="flex h-[calc(100vh-theme(spacing.16)-theme(spacing.10))] flex-col gap-3 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="flex flex-col gap-2 rounded-xl border border-border/50 bg-card/60 p-3 shadow-md backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Chat</h1>
            <p className="text-sm text-muted-foreground">
              {currentFolder?.name
                ? `Chat with knowledge graph + web search (folder: ${currentFolder.name})`
                : 'Chat with knowledge graph + web search'}
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
          <span className="font-medium">Mode:</span>
          <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.5">Full Response</span>
        </div>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        <Card className="flex-1 flex flex-col bg-card/70 backdrop-blur-md border-border/60 shadow-lg">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <MessageBubble key={index} message={message} onWebSearch={performWebSearch} messageIndex={index} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
          <ChatInput
            input={input}
            setInput={setInput}
            onSubmit={sendMessage}
            onWebSearch={(searchQuery) =>
              performWebSearch({
                question: searchQuery,
                contextHint: currentFolder?.name || 'general',
                appendMessage: true,
              })
            }
            loading={loading}
            inputRef={inputRef}
          />
        </Card>

        {isHistoryOpen && (
          <div className="w-72 shrink-0">
            <ChatHistoryPanel
              chatHistory={chatHistory}
              onRestore={restoreSession}
              onDelete={deleteSession}
              onExportText={exportToText}
              onExportJson={exportToJson}
            />
          </div>
        )}
      </div>
    </div>
  );
}
