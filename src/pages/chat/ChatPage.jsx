import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { RotateCcw, PanelRightClose, Download, ChevronDown, FileText, FileJson, SquarePen } from 'lucide-react';
import { MessageBubble, TypingIndicator } from './MessageBubble';
import { ChatInput } from './ChatInput';
const ChatHistoryPanel = React.lazy(() =>
  import('./ChatHistoryPanel').then((m) => ({ default: m.ChatHistoryPanel }))
);
import api from '../../services/api';
import chatService from '../../services/chatService';
import { useGlobalFolder } from '../../contexts/GlobalFolderContext';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';
import { jsPDF } from 'jspdf';
import {
  WELCOME_MESSAGE,
  createBlankSession,
  getChatStorageKey,
  getDefaultSessionTitle,
  loadChatWorkspace,
  removeSession,
  saveChatWorkspace,
  selectSessionForFolder,
  getSessionTitleFromMessages,
} from './chatSessionStorage';
import { exportToText } from './downloads/exportToText';
import { exportToJson } from './downloads/exportToJson';
import { exportToPdf } from './downloads/exportToPdf';

export default function ChatPage() {
  const { currentFolder, selectedFolderId, setSelectedFolderId } = useGlobalFolder();
  const { user } = useAuth();
  const userKey = user?.id || user?.email || user?.username || 'anonymous';
  const storageKey = useMemo(() => getChatStorageKey(userKey), [userKey]);
  const [workspace, setWorkspace] = useState(() => loadChatWorkspace(userKey));
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHistoryOpen, setHistoryOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1280 : false));
  const [isDownloadOpen, setDownloadOpen] = useState(false);
  const [isWorkspaceLoading, setWorkspaceLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const downloadMenuRef = useRef(null);
  const hasHydratedWorkspaceRef = useRef(false);
  const lastFolderIdRef = useRef(selectedFolderId || '');

  const activeSession = useMemo(
    () => workspace.sessions.find((session) => session.id === workspace.currentSessionId) || null,
    [workspace]
  );
  const messages = activeSession?.messages || [WELCOME_MESSAGE];
  const chatHistory = useMemo(
    () => (Array.isArray(workspace?.sessions) ? workspace.sessions : [])
      .filter(Boolean)
      .map((session) => ({
        ...session,
        messages: Array.isArray(session?.messages) ? session.messages : [],
      }))
      .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)),
    [workspace]
  );
  const hasPendingWebSearchMessage = messages.some((message) => message?.webSearchPending);

  const normalizeBackendMessages = (rawMessages = []) => {
    if (!Array.isArray(rawMessages)) return [];
    const result = [];
    for (const msg of rawMessages) {
      if (msg.role === 'web_search') {
        // Attach web search answer to the previous assistant message
        const lastMsg = result[result.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          lastMsg.webSearchAnswer = msg.message || msg.content || '';
          // Parse citations JSON → webSearchSources array
          let sources = [];
          try {
            const raw = msg.citations || '[]';
            sources = typeof raw === 'string' ? JSON.parse(raw) : Array.isArray(raw) ? raw : [];
          } catch { sources = []; }
          lastMsg.webSearchSources = sources.map((s) => ({
            title: s?.title || 'Source',
            url: s?.uri || s?.url || '',
          })).filter((s) => s.url);
        }
        continue;
      }
      result.push({
        role: msg.role || 'assistant',
        content: msg.message || msg.content || '',
        citations: msg.citations || msg.sources || [],
        timestamp: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now(),
      });
    }
    return result;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!downloadMenuRef.current?.contains(event.target)) {
        setDownloadOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (!isDownloadOpen || !downloadMenuRef.current) return;

    const handleScroll = () => setDownloadOpen(false);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isDownloadOpen]);

  useEffect(() => {
    setWorkspaceLoading(true);
    hasHydratedWorkspaceRef.current = false;
    setWorkspace(loadChatWorkspace(userKey));
    queueMicrotask(() => {
      hasHydratedWorkspaceRef.current = true;
      setWorkspaceLoading(false);
    });
  }, [storageKey]);

  // Sync from backend when user logs in
  useEffect(() => {
    if (!user || !user.id) {
      // User logged out - clear will happen on next login
      return;
    }

    const syncFromBackend = async () => {
      setWorkspaceLoading(true);
      hasHydratedWorkspaceRef.current = false;
      try {
        const backendWorkspace = await chatService.syncWorkspaceFromBackend();
        if (backendWorkspace) {
          setWorkspace((prev) => {
            const backendSet = new Set(backendWorkspace.sessions.map((session) => session.id));
            // Merge: keep local sessions that already have messages (they're richer than backend shells)
            const localSessionMap = new Map(prev.sessions.map((s) => [s.id, s]));
            const mergedSessions = [
              ...backendWorkspace.sessions.map((backendSession) => {
                const local = localSessionMap.get(backendSession.id);
                // If local version exists AND has real messages, keep local
                if (local && Array.isArray(local.messages) && local.messages.length > 0 && !local.messages[0]?.isWelcome) {
                  return local;
                }
                return {
                  ...backendSession,
                  messages: Array.isArray(backendSession.messages) && backendSession.messages.length > 0 ? backendSession.messages : [WELCOME_MESSAGE],
                };
              }),
              ...prev.sessions.filter((session) => !backendSet.has(session.id)),
            ];

            const merged = {
              ...prev,
              sessions: mergedSessions,
              currentSessionId: prev.currentSessionId || backendWorkspace.currentSessionId || mergedSessions[0]?.id,
            };
            // Explicitly save merged data so it persists across refreshes
            saveChatWorkspace(userKey, merged);
            return merged;
          });
        }
      } catch (error) {
        console.error('Failed to sync from backend:', error);
        // Fall back to localStorage if backend sync fails
      } finally {
        queueMicrotask(() => {
          hasHydratedWorkspaceRef.current = true;
          setWorkspaceLoading(false);
        });
      }
    };

    syncFromBackend();
  }, [user?.id]);

  useEffect(() => {
    if (!selectedFolderId) return;
    if (!hasHydratedWorkspaceRef.current) {
      lastFolderIdRef.current = selectedFolderId;
      return;
    }
    if (String(lastFolderIdRef.current || '') === String(selectedFolderId)) {
      return;
    }
    lastFolderIdRef.current = selectedFolderId;
    // Just update the current session's folder context — do NOT auto-switch sessions
    // User stays on the same chat until they click "New Chat"
    setWorkspace((prev) => {
      const currentSession = prev.sessions.find((session) => session.id === prev.currentSessionId);
      if (!currentSession) return prev;
      return {
        ...prev,
        sessions: prev.sessions.map((session) =>
          session.id === prev.currentSessionId
            ? { ...session, folderId: String(selectedFolderId), folderName: currentFolder?.name || session.folderName }
            : session
        ),
      };
    });
  }, [selectedFolderId, currentFolder?.name]);

  useEffect(() => {
    if (!hasHydratedWorkspaceRef.current) return;
    saveChatWorkspace(userKey, workspace);
  }, [workspace, userKey]);

  // Safety net: save workspace before page close/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveChatWorkspace(userKey, workspace);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [workspace, userKey]);

  if (isWorkspaceLoading) {
    return (
      <div className="flex min-h-[calc(100vh-theme(spacing.16))] items-center justify-center p-6">
        <div className="w-full max-w-xs rounded-3xl border border-border/40 bg-card/80 p-6 text-center shadow-lg backdrop-blur-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <h2 className="mt-3 text-base font-semibold">Loading chat environment</h2>
          <p className="mt-1 text-sm text-muted-foreground">Preparing your sessions and history...</p>
        </div>
      </div>
    );
  }

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

  const persistWorkspace = (nextWorkspace) => {
    setWorkspace(nextWorkspace);
    saveChatWorkspace(userKey, nextWorkspace);
  };

  const updateCurrentSession = (updater) => {
    setWorkspace((prev) => {
      const current = prev.sessions.find((session) => session.id === prev.currentSessionId);
      if (!current) return prev;
      const nextSession = updater(current);
      // Update in-place — do NOT reorder sessions
      const sessions = prev.sessions.map((session) =>
        session.id === nextSession.id ? nextSession : session
      );
      const nextWorkspace = { currentSessionId: nextSession.id, sessions };
      saveChatWorkspace(userKey, nextWorkspace);
      return nextWorkspace;
    });
  };

  const updateMessageAtIndex = (index, updater) => {
    updateCurrentSession((session) => ({
      ...session,
      messages: session.messages.map((message, messageIndex) => (messageIndex === index ? updater(message) : message)),
      title: session.title || getSessionTitleFromMessages(session.messages, getDefaultSessionTitle(currentFolder?.name || 'New Chat')),
      updatedAt: Date.now(),
    }));
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
      appendedMessageIndex = messages.length;
      updateCurrentSession((session) => ({
        ...session,
        messages: [
          ...session.messages,
          {
            role: 'assistant',
            content: `Searching web for: "${searchQuery}"...`,
            isWebSearch: true,
            webSearchPending: true,
            webSearchQuery: searchQuery,
            webSearchContextHint: fallbackContext,
          },
        ],
        updatedAt: Date.now(),
      }));
    }

    setLoading(true);

    try {
      const response = await api.post('/combined-chat/web-search', {
        question: searchQuery,
        context_hint: fallbackContext,
        session_id: workspace.currentSessionId || null,
      });

      const fullAnswer = response.data?.answer || response.data?.response || 'No results found from web search.';
      const sources = normalizeWebSearchSources(response.data?.grounding_metadata);

      // Helper to typewrite the web search answer word-by-word
      const typewriteWebAnswer = (targetIndex) => {
        const words = fullAnswer.split(' ');
        let wordIdx = 0;

        // Set initial state with empty answer + streaming flag
        updateMessageAtIndex(targetIndex, (message) => ({
          ...message,
          webSearchPending: false,
          webSearchAnswer: '',
          webSearchSources: sources,
          isWebSearch: true,
          isStreamingWebSearch: true,
          webSearchQuery: searchQuery,
          webSearchContextHint: fallbackContext,
        }));

        const interval = setInterval(() => {
          if (wordIdx >= words.length) {
            clearInterval(interval);
            // Finalize: remove streaming flag
            updateMessageAtIndex(targetIndex, (message) => ({
              ...message,
              isStreamingWebSearch: false,
            }));
            return;
          }
          const nextWord = words[wordIdx];
          wordIdx++;
          updateMessageAtIndex(targetIndex, (message) => ({
            ...message,
            webSearchAnswer: (message.webSearchAnswer || '') + (message.webSearchAnswer ? ' ' : '') + nextWord,
          }));
        }, 20);
      };

      if (typeof messageIndex === 'number') {
        typewriteWebAnswer(messageIndex);
      } else if (appendMessage && typeof appendedMessageIndex === 'number') {
        updateMessageAtIndex(appendedMessageIndex, (message) => ({
          ...message,
          content: `Web search results for "${searchQuery}"`,
        }));
        typewriteWebAnswer(appendedMessageIndex);
      } else {
        // Append new message then typewrite into it
        updateCurrentSession((session) => ({
          ...session,
          messages: [
            ...session.messages,
            {
              role: 'assistant',
              content: `Web search results for "${searchQuery}"`,
              isWebSearch: true,
              webSearchPending: false,
              webSearchAnswer: '',
              isStreamingWebSearch: true,
              webSearchSources: sources,
              webSearchQuery: searchQuery,
              webSearchContextHint: fallbackContext,
            },
          ],
          updatedAt: Date.now(),
        }));
        // Typewrite the last message
        const targetIdx = messages.length; // will be the newly appended message
        const words = fullAnswer.split(' ');
        let wordIdx = 0;
        const interval = setInterval(() => {
          if (wordIdx >= words.length) {
            clearInterval(interval);
            updateMessageAtIndex(targetIdx, (message) => ({
              ...message,
              isStreamingWebSearch: false,
            }));
            return;
          }
          const nextWord = words[wordIdx];
          wordIdx++;
          updateMessageAtIndex(targetIdx, (message) => ({
            ...message,
            webSearchAnswer: (message.webSearchAnswer || '') + (message.webSearchAnswer ? ' ' : '') + nextWord,
          }));
        }, 20);
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
        updateCurrentSession((session) => ({
          ...session,
          messages: [...session.messages, errorMessage],
          updatedAt: Date.now(),
        }));
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
    const nextSessionTitle = getSessionTitleFromMessages([...messages.filter((msg) => !msg.isWelcome), { role: 'user', content: userMessage }], currentFolder?.name || 'New Chat');

    // 1. Add user message + empty assistant placeholder (for streaming into)
    updateCurrentSession((session) => ({
      ...session,
      title: session.title && session.title !== getDefaultSessionTitle(currentFolder?.name || 'New Chat') ? session.title : nextSessionTitle,
      folderId: selectedFolderId ? String(selectedFolderId) : session.folderId,
      folderName: currentFolder?.name || session.folderName,
      messages: [
        ...session.messages,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: '', isStreaming: true },
      ],
      updatedAt: Date.now(),
    }));
    setLoading(true);

    try {
      const activeMessages = messages
        .filter((message) => message.role !== 'system' && !message.isWelcome)
        .map((message) => ({ role: message.role, content: message.content }));

      // 2. Use fetch + ReadableStream for real-time token streaming
      const token = localStorage.getItem('neural_nexus_token');
      const response = await fetch('/api/v1/combined-chat/stream-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          question: userMessage,
          folder_id: selectedFolderId || null,
          session_id: workspace.currentSessionId || null,
          history: activeMessages.slice(-10),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // 3. Read the NDJSON stream line by line
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream available');

      const decoder = new TextDecoder();
      let buffer = '';
      let streamedIntent = {};
      let streamedAlgorithm = null;
      let streamedResults = null;
      let suggestWebSearch = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const chunk = JSON.parse(trimmed);

            switch (chunk.type) {
              case 'content':
                // 4. Append each content token to the assistant message in real-time
                setWorkspace((prev) => {
                  const session = prev.sessions.find((s) => s.id === prev.currentSessionId);
                  if (!session) return prev;
                  const msgs = [...session.messages];
                  const lastMsg = msgs[msgs.length - 1];
                  if (lastMsg?.role === 'assistant') {
                    msgs[msgs.length - 1] = { ...lastMsg, content: lastMsg.content + chunk.data };
                  }
                  return {
                    ...prev,
                    sessions: prev.sessions.map((s) =>
                      s.id === prev.currentSessionId ? { ...s, messages: msgs, updatedAt: Date.now() } : s
                    ),
                  };
                });
                break;

              case 'intent':
                streamedIntent = chunk.data || {};
                break;

              case 'gds_results':
                streamedAlgorithm = chunk.data?.algorithm || null;
                streamedResults = chunk.data?.results || null;
                break;

              case 'web_search_suggestion':
                suggestWebSearch = chunk.data ?? true;
                break;

              case 'step':
                // Could be used for progress indicators in the future
                break;
            }
          } catch {
            // Skip malformed JSON lines (flush padding etc.)
          }
        }
      }

      // 5. Finalize the assistant message: remove streaming flag, add metadata
      setWorkspace((prev) => {
        const session = prev.sessions.find((s) => s.id === prev.currentSessionId);
        if (!session) return prev;
        const msgs = [...session.messages];
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg?.role === 'assistant') {
          msgs[msgs.length - 1] = {
            ...lastMsg,
            isStreaming: false,
            intent: streamedIntent,
            algorithm: streamedAlgorithm,
            results: streamedResults,
            webSearchSuggested: suggestWebSearch,
            webSearchQuery: userMessage,
          };
        }
        const nextWorkspace = {
          ...prev,
          sessions: prev.sessions.map((s) =>
            s.id === prev.currentSessionId ? { ...s, messages: msgs, updatedAt: Date.now() } : s
          ),
        };
        saveChatWorkspace(userKey, nextWorkspace);
        return nextWorkspace;
      });

    } catch (error) {
      console.error('Chat error', error);
      // Update the placeholder message with error
      setWorkspace((prev) => {
        const session = prev.sessions.find((s) => s.id === prev.currentSessionId);
        if (!session) return prev;
        const msgs = [...session.messages];
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg?.role === 'assistant') {
          msgs[msgs.length - 1] = {
            ...lastMsg,
            content: 'Sorry, I encountered an error. Please make sure the backend is running and try again.',
            isError: true,
            isStreaming: false,
          };
        }
        return {
          ...prev,
          sessions: prev.sessions.map((s) =>
            s.id === prev.currentSessionId ? { ...s, messages: msgs, updatedAt: Date.now() } : s
          ),
        };
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const startNewChat = () => {
    const nextSession = createBlankSession({
      folderId: selectedFolderId || '',
      folderName: currentFolder?.name || '',
    });
    persistWorkspace({
      currentSessionId: nextSession.id,
      sessions: [nextSession, ...workspace.sessions],
    });
    setInput('');
    setHistoryOpen(false);
    inputRef.current?.focus();
  };

  const clearChat = () => {
    updateCurrentSession((session) => ({
      ...session,
      title: getDefaultSessionTitle(currentFolder?.name || session.folderName || 'New Chat'),
      messages: [WELCOME_MESSAGE],
      updatedAt: Date.now(),
    }));
    setInput('');
    inputRef.current?.focus();
  };

  const handleExportText = () => {
    exportToText({
      messages,
      folderName: currentFolder?.name,
      chatMode: 'research'
    });
  };

  const handleExportJson = () => {
    exportToJson({
      messages,
      folderName: currentFolder?.name,
      sessionId: workspace.currentSessionId,
      activeSessionTitle: activeSession?.title
    });
  };

  const handleExportPdf = () => {
    exportToPdf({
      messages,
      folderName: currentFolder?.name,
      sessionTitle: activeSession?.title
    });
  };

  const restoreSession = async (id) => {
    try {
      // Find session from current chatHistory
      const session = chatHistory.find((item) => item.id === id);
      if (!session) return;

      let sessionMessages = Array.isArray(session.messages) ? [...session.messages] : [];

      // Filter out welcome-only messages (they're just placeholders)
      const realMessages = sessionMessages.filter((m) => !m?.isWelcome);

      // Lazy-load from backend if no real messages
      if (realMessages.length === 0 && user?.id) {
        const backendMessages = await chatService.getSessionHistory(id, 200);
        const normalized = normalizeBackendMessages(backendMessages);
        if (normalized.length > 0) sessionMessages = normalized;
      }

      // Use functional update to avoid stale closure
      setWorkspace((prev) => {
        const nextWorkspace = {
          ...prev,
          currentSessionId: id,
          sessions: prev.sessions.map((entry) =>
            entry.id === id
              ? {
                  ...entry,
                  messages: sessionMessages.length > 0 ? sessionMessages : [WELCOME_MESSAGE],
                  folderId: session.folderId || entry.folderId,
                  folderName: session.folderName || entry.folderName,
                }
              : entry
          ),
        };
        saveChatWorkspace(userKey, nextWorkspace);
        return nextWorkspace;
      });

      if (session.folderId) {
        setSelectedFolderId(String(session.folderId));
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    }
  };

  const deleteSession = (id) => {
    const nextWorkspace = removeSession(workspace, id);
    persistWorkspace(nextWorkspace);
    if (nextWorkspace.currentSessionId !== workspace.currentSessionId) {
      const nextSession = nextWorkspace.sessions.find((session) => session.id === nextWorkspace.currentSessionId);
      if (nextSession) {
        if (nextSession.folderId) {
          setSelectedFolderId(String(nextSession.folderId));
        }
        setHistoryOpen(false);
      }
    }
  };

  return (
    <>
    <div className="-mx-6 -my-5 flex h-[calc(100vh-theme(spacing.16))] w-[calc(100%+theme(spacing.12))] flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <div className="px-6 pt-4">
        <section className="rounded-[28px] border border-border/50 bg-card/75 px-5 py-3.5 shadow-[0_18px_50px_-36px_rgba(92,72,58,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-1.5">
              <div className="space-y-1">
                <h1 className="text-[1.8rem] font-semibold tracking-tight text-foreground">Chat</h1>
                <p className="max-w-3xl text-sm text-muted-foreground">
                  {currentFolder?.name
                    ? (
                      <>
                        Ask about{' '}
                        <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                          {currentFolder.name}
                        </span>
                        , inspect answers, and open web sources when needed.
                      </>
                    )
                    : 'Ask about your knowledge graph, review grounded answers, and open web sources when needed.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="sm" onClick={startNewChat} className="gap-1.5">
                <SquarePen className="h-4 w-4" />
                New chat
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
              <div className="relative" ref={downloadMenuRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => setDownloadOpen(true)}
                  aria-expanded={isDownloadOpen}
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="relative flex min-h-0 flex-1 overflow-hidden px-6 pb-5 pt-3">
        <div className="flex min-h-0 flex-1 gap-0 lg:gap-4">
          <div
            className={cn(
              'flex min-h-0 flex-1 flex-col overflow-hidden rounded-[32px] border border-border/50 bg-card/75 shadow-[0_24px_70px_-48px_rgba(92,72,58,0.45)] backdrop-blur-xl',
              isHistoryOpen ? 'lg:border-r-0 lg:rounded-r-none' : ''
            )}
          >
          <div className="flex items-center justify-between gap-3 border-b border-border/40 px-5 py-2.5">
            <div>
              <p className="text-sm font-semibold text-foreground">Conversation</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 lg:px-6">
            {messages.map((message, index) => (
              <MessageBubble key={index} message={message} onWebSearch={performWebSearch} messageIndex={index} />
            ))}
            {loading && (() => {
              const lastMsg = messages[messages.length - 1];
              // Don't show typing dots if a streaming message already exists (it has its own cursor)
              if (lastMsg?.isStreaming) return null;
              // Show typing indicator only while waiting for first content token
              const isWaitingForFirstToken = !lastMsg || lastMsg.role !== 'assistant' || !lastMsg.content;
              return isWaitingForFirstToken && !hasPendingWebSearchMessage ? <TypingIndicator /> : null;
            })()}
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

          <aside
            id="chat-history-drawer"
            className={cn(
              'hidden min-h-0 w-[19rem] shrink-0 border-l border-border/40 lg:block',
              isHistoryOpen ? 'lg:block' : 'lg:hidden'
            )}
            aria-hidden={!isHistoryOpen}
          >
            <div className="h-full overflow-hidden rounded-[32px] rounded-l-none border border-border/50 border-l-0 bg-card/75 shadow-[0_24px_70px_-48px_rgba(92,72,58,0.45)] backdrop-blur-xl">
              <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading history...</div>}>
                <ChatHistoryPanel
                  chatHistory={chatHistory}
                  activeSessionId={workspace.currentSessionId}
                  onRestore={restoreSession}
                  onDelete={deleteSession}
                  onClose={() => setHistoryOpen(false)}
                />
              </Suspense>
            </div>
          </aside>
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
          className={cn(
            'absolute right-6 top-3 bottom-5 z-20 w-[min(100vw-3rem,19rem)] translate-x-[110%] transition-transform duration-300 ease-out lg:hidden',
            isHistoryOpen ? 'translate-x-0' : 'pointer-events-none'
          )}
          aria-hidden={!isHistoryOpen}
        >
          <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading history...</div>}>
            <ChatHistoryPanel
              chatHistory={chatHistory}
              activeSessionId={workspace.currentSessionId}
              onRestore={restoreSession}
              onDelete={deleteSession}
              onClose={() => setHistoryOpen(false)}
            />
          </Suspense>
        </aside>
      </div>
    </div>
    {isDownloadOpen && (
      <div
        className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/55 backdrop-blur-sm px-4"
        onClick={() => setDownloadOpen(false)}
      >
        <div
          className="w-full max-w-sm rounded-[32px] border border-border/70 bg-card/97 p-8 shadow-[0_32px_100px_-32px_rgba(0,0,0,0.5)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-6">
            <div className="space-y-1">
              <h3 className="text-xl font-bold tracking-tight text-foreground">Download session</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Choose format</p>
            </div>
            <button
              aria-label="Close download"
              onClick={() => setDownloadOpen(false)}
              className="h-10 w-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/40 transition-colors"
            >
              <RotateCcw className="h-5 w-5 rotate-45" />
            </button>
          </div>
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                handleExportText();
                setDownloadOpen(false);
              }}
              className="group flex w-full items-center gap-4 rounded-2xl bg-muted/20 px-5 py-4 text-left transition-all hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">As Plain Text</p>
                <p className="text-xs text-muted-foreground">Best for quick reading (.txt)</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                handleExportJson();
                setDownloadOpen(false);
              }}
              className="group flex w-full items-center gap-4 rounded-2xl bg-muted/20 px-5 py-4 text-left transition-all hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                <FileJson className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">As JSON Data</p>
                <p className="text-xs text-muted-foreground">Best for portability (.json)</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                handleExportPdf();
                setDownloadOpen(false);
              }}
              className="group flex w-full items-center gap-4 rounded-2xl bg-muted/20 px-5 py-4 text-left transition-all hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                <Download className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">As PDF Document</p>
                <p className="text-xs text-muted-foreground">Best for sharing (.pdf)</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
