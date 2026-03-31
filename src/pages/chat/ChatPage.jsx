import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { RotateCcw, ChevronRight, ArrowDownToLine, Sparkles, PanelRightClose, FolderOpen } from 'lucide-react';
import { MessageBubble, TypingIndicator } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ChatHistoryPanel } from './ChatHistoryPanel';
import api from '../../services/api';
import { useGlobalFolder } from '../../contexts/GlobalFolderContext';
import { cn } from '../../utils/cn';

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
  const [isHistoryOpen, setHistoryOpen] = useState(false);
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
    <div className="-mx-6 -my-5 flex h-[calc(100vh-theme(spacing.16))] w-[calc(100%+theme(spacing.12))] flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <div className="px-6 pt-5">
        <section className="rounded-[30px] border border-border/50 bg-card/75 px-5 py-4 shadow-[0_18px_50px_-36px_rgba(92,72,58,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                <Sparkles className="h-3.5 w-3.5" />
                Conversation Workspace
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Chat</h1>
                <p className="max-w-3xl text-sm text-muted-foreground">
                  {currentFolder?.name
                    ? `Ask about the selected folder, inspect answers, and open web sources when needed. Folder: ${currentFolder.name}.`
                    : 'Ask about your knowledge graph, review grounded answers, and open web sources when needed.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2.5 py-1">
                  <FolderOpen className="h-3.5 w-3.5 text-emerald-600" />
                  {currentFolder?.name || 'No folder selected'}
                </span>
                <span className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1">
                  {readOnlyMessageCount} message{readOnlyMessageCount === 1 ? '' : 's'}
                </span>
                <span className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-emerald-700 dark:text-emerald-300">
                  Web search ready
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={scrollToBottom}
                aria-label="Scroll to latest message"
              >
                <ArrowDownToLine className="h-4 w-4" />
                Latest
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => setHistoryOpen((v) => !v)}
                aria-expanded={isHistoryOpen}
                aria-controls="chat-history-drawer"
              >
                <PanelRightClose className="h-4 w-4" />
                {isHistoryOpen ? 'Hide history' : 'Open history'}
              </Button>
              <Button variant="outline" size="sm" onClick={clearChat} className="gap-1.5">
                <RotateCcw className="h-4 w-4" />
                Clear chat
              </Button>
            </div>
          </div>
        </section>
      </div>

      <div className="relative flex min-h-0 flex-1 overflow-hidden px-6 pb-5 pt-4">
        <div className={cn(
          'flex min-h-0 flex-1 flex-col overflow-hidden rounded-[32px] border border-border/50 bg-card/75 shadow-[0_24px_70px_-48px_rgba(92,72,58,0.45)] backdrop-blur-xl',
          isHistoryOpen ? 'lg:pr-[22rem]' : ''
        )}>
          <div className="flex items-center justify-between gap-3 border-b border-border/40 px-5 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Conversation</p>
              <p className="text-xs text-muted-foreground">
                Messages stay here while history opens as a drawer on the right.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="hidden gap-1.5 lg:inline-flex"
              onClick={scrollToBottom}
              aria-label="Jump to latest message"
            >
              <ChevronRight className="h-4 w-4 rotate-90" />
              Latest
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 lg:px-6">
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
        </div>

        <div
          className={cn(
            'absolute inset-0 z-10 bg-stone-950/10 backdrop-blur-[1px] transition-opacity lg:hidden',
            isHistoryOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          )}
          onClick={() => setHistoryOpen(false)}
          aria-hidden={!isHistoryOpen}
        />

        <aside
          id="chat-history-drawer"
          className={cn(
            'absolute right-6 top-4 bottom-5 z-20 w-[min(100vw-3rem,22rem)] translate-x-[110%] transition-transform duration-300 ease-out',
            isHistoryOpen ? 'translate-x-0' : 'pointer-events-none'
          )}
          aria-hidden={!isHistoryOpen}
        >
          <ChatHistoryPanel
            chatHistory={chatHistory}
            onRestore={restoreSession}
            onDelete={deleteSession}
            onExportText={exportToText}
            onExportJson={exportToJson}
            onClose={() => setHistoryOpen(false)}
          />
        </aside>
      </div>
    </div>
  );
}
