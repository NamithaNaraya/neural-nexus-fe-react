import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { RotateCcw, PanelRightClose, Download, ChevronDown, FileText, FileJson, SquarePen } from 'lucide-react';
import { MessageBubble, TypingIndicator } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ChatHistoryPanel } from './ChatHistoryPanel';
import api from '../../services/api';
import { useGlobalFolder } from '../../contexts/GlobalFolderContext';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';
import jsPDF from 'jspdf';
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
  const chatHistory = workspace.sessions.slice().sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
  const hasPendingWebSearchMessage = messages.some((message) => message?.webSearchPending);

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
    hasHydratedWorkspaceRef.current = false;
    setWorkspace(loadChatWorkspace(userKey));
    queueMicrotask(() => {
      hasHydratedWorkspaceRef.current = true;
    });
  }, [storageKey]);

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
    setWorkspace((prev) => {
      const currentSession = prev.sessions.find((session) => session.id === prev.currentSessionId);
      if (String(currentSession?.folderId || '') === String(selectedFolderId)) {
        return prev;
      }
      return selectSessionForFolder(prev, selectedFolderId, currentFolder?.name || '');
    });
  }, [selectedFolderId, currentFolder?.name]);

  useEffect(() => {
    if (!hasHydratedWorkspaceRef.current) return;
    saveChatWorkspace(userKey, workspace);
  }, [workspace, userKey]);

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
      const sessions = [nextSession, ...prev.sessions.filter((session) => session.id !== nextSession.id)];
      const nextWorkspace = { currentSessionId: nextSession.id, sessions };
      saveChatWorkspace(userKey, nextWorkspace);
      return nextWorkspace;
    });
  };

  const updateMessageAtIndex = (index, updater) => {
    updateCurrentSession((session) => ({
      ...session,
      messages: session.messages.map((message, messageIndex) => (messageIndex === index ? updater(message) : message)),
      title: session.title || getSessionTitleFromMessages(session.messages, getDefaultSessionTitle(currentFolder?.name || 'Chat Session')),
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
        updateCurrentSession((session) => ({
          ...session,
          messages: [
            ...session.messages,
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
          ],
          updatedAt: Date.now(),
        }));
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
    const nextSessionTitle = getSessionTitleFromMessages([...messages.filter((msg) => !msg.isWelcome), { role: 'user', content: userMessage }], currentFolder?.name || 'Chat Session');
    updateCurrentSession((session) => ({
      ...session,
      title: session.title && session.title !== getDefaultSessionTitle(currentFolder?.name || 'Chat Session') ? session.title : nextSessionTitle,
      folderId: selectedFolderId ? String(selectedFolderId) : session.folderId,
      folderName: currentFolder?.name || session.folderName,
      messages: [...session.messages, { role: 'user', content: userMessage }],
      updatedAt: Date.now(),
    }));
    setLoading(true);

    try {
      const activeMessages = messages
        .filter((message) => message.role !== 'system' && !message.isWelcome)
        .map((message) => ({ role: message.role, content: message.content }));

      // Call non-streaming endpoint that returns full response
      const response = await api.post('/combined-chat/answer', {
        question: userMessage,
        folder_id: selectedFolderId || null,
        session_id: workspace.currentSessionId || null,
        history: activeMessages.slice(-10),
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

      updateCurrentSession((session) => ({
        ...session,
        messages: [
          ...session.messages,
          {
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
          },
        ],
        updatedAt: Date.now(),
      }));

    } catch (error) {
      console.error('Chat error', error);
      updateCurrentSession((session) => ({
        ...session,
        messages: [
          ...session.messages,
          {
            role: 'assistant',
            content: 'Sorry, I encountered an error. Please make sure the backend is running and try again.',
            isError: true,
          },
        ],
        updatedAt: Date.now(),
      }));
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
      title: getDefaultSessionTitle(currentFolder?.name || session.folderName || 'Chat Session'),
      messages: [WELCOME_MESSAGE],
      updatedAt: Date.now(),
    }));
    setInput('');
    inputRef.current?.focus();
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

  const exportToPdf = () => {
    if (messages.length === 0) return;

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const margin = 14;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = margin;

    const pushLine = (line, fontSize = 11, color = [40, 40, 40]) => {
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);
      const lines = doc.splitTextToSize(String(line || ''), pageWidth - margin * 2);
      lines.forEach((part) => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(part, margin, y);
        y += fontSize * 0.42;
      });
      y += 2;
    };

    doc.setFont('helvetica', 'bold');
    pushLine(`Neural Nexus Chat Export`, 16, [30, 41, 59]);
    doc.setFont('helvetica', 'normal');
    pushLine(`Folder: ${currentFolder?.name || 'Global'}`, 10, [75, 85, 99]);
    pushLine(`Session: ${activeSession?.title || 'Current conversation'}`, 10, [75, 85, 99]);
    pushLine(`Exported: ${new Date().toLocaleString()}`, 10, [75, 85, 99]);
    y += 2;

    messages.forEach((message, index) => {
      const label = message.role === 'user' ? 'User' : message.isWebSearch ? 'Assistant / Web' : 'Assistant';
      doc.setFont('helvetica', 'bold');
      pushLine(`${label}`, 11, message.role === 'user' ? [22, 101, 52] : [92, 72, 58]);
      doc.setFont('helvetica', 'normal');
      pushLine(message.content || '', 10, [41, 37, 36]);
      if (message.webSearchAnswer) {
        doc.setFont('helvetica', 'bold');
        pushLine('Web insights', 10, [5, 150, 105]);
        doc.setFont('helvetica', 'normal');
        pushLine(message.webSearchAnswer, 10, [68, 64, 60]);
      }
      if (index < messages.length - 1) {
        y += 2;
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, y, pageWidth - margin, y);
        y += 4;
      }
    });

    doc.save(`chat-${Date.now()}.pdf`);
  };

  const restoreSession = (id) => {
    const session = chatHistory.find((item) => item.id === id);
    if (session) {
      const nextWorkspace = {
        currentSessionId: session.id,
        sessions: workspace.sessions.map((entry) =>
          entry.id === session.id
            ? {
                ...entry,
                messages: session.messages,
                folderId: session.folderId || entry.folderId,
                folderName: session.folderName || entry.folderName,
                updatedAt: Date.now(),
              }
            : entry
        ),
      };
      persistWorkspace(nextWorkspace);
      if (session.folderId) {
        setSelectedFolderId(String(session.folderId));
      }
      setHistoryOpen(false);
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
                  className="gap-1.5"
                  onClick={() => setDownloadOpen((open) => !open)}
                  aria-expanded={isDownloadOpen}
                >
                  <Download className="h-4 w-4" />
                  Download
                  <ChevronDown className={cn('h-4 w-4 transition-transform', isDownloadOpen ? 'rotate-180' : '')} />
                </Button>
                {isDownloadOpen && (
                  <div className="absolute right-0 top-11 z-20 min-w-48 rounded-2xl border border-border/60 bg-card/95 p-2 shadow-[0_20px_55px_-35px_rgba(92,72,58,0.45)] backdrop-blur-xl">
                    <button
                      type="button"
                      onClick={() => {
                        exportToText();
                        setDownloadOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                    >
                      <FileText className="h-4 w-4 text-emerald-600" />
                      Download TXT
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportToJson();
                        setDownloadOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                    >
                      <FileJson className="h-4 w-4 text-emerald-600" />
                      Download JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportToPdf();
                        setDownloadOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                    >
                      <Download className="h-4 w-4 text-emerald-600" />
                      Download PDF
                    </button>
                  </div>
                )}
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
            {loading && !hasPendingWebSearchMessage ? <TypingIndicator /> : null}
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
              <ChatHistoryPanel
                chatHistory={chatHistory}
                activeSessionId={workspace.currentSessionId}
                onRestore={restoreSession}
                onDelete={deleteSession}
                onClose={() => setHistoryOpen(false)}
              />
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
          <ChatHistoryPanel
            chatHistory={chatHistory}
            activeSessionId={workspace.currentSessionId}
            onRestore={restoreSession}
            onDelete={deleteSession}
            onClose={() => setHistoryOpen(false)}
          />
        </aside>
      </div>
    </div>
  );
}
