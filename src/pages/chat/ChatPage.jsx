import React, { Suspense, startTransition, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { RotateCcw, PanelRightClose, Download, ChevronDown, FileText, FileJson, SquarePen } from 'lucide-react';
import { MessageBubble, TypingIndicator } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { VirtualMessageList } from './components/VirtualMessageList';
const ChatHistoryPanel = React.lazy(() =>
  import('./ChatHistoryPanel').then((m) => ({ default: m.ChatHistoryPanel }))
);
import api from '../../services/api';
import chatService from '../../services/chatService';
import { useGlobalFolder } from '../../contexts/GlobalFolderContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChatHistorySkeleton } from './components/ChatHistorySkeleton';
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

const hasStoredChatContent = (messages = []) =>
  Array.isArray(messages) &&
  messages.some((message) => {
    const content = String(message?.content || '').trim();
    return (
      (!message?.isWelcome && content.length > 0) ||
      Boolean(message?.webSearchAnswer) ||
      Boolean(message?.webSearchPending) ||
      Boolean(message?.webSearchSuggested) ||
      (Array.isArray(message?.webSearchSources) && message.webSearchSources.length > 0) ||
      (Array.isArray(message?.results) && message.results.length > 0)
    );
  });

const hasStoredWebSearchContent = (messages = []) =>
  Array.isArray(messages) &&
  messages.some((message) =>
    Boolean(message?.webSearchAnswer) ||
    (Array.isArray(message?.webSearchSources) && message.webSearchSources.length > 0)
  );

const MAX_WEB_SOURCE_COUNT = 6;
const INTERNAL_SOURCE_HOSTS = new Set([
  'vertexaisearch.cloud.google.com',
  'generativelanguage.googleapis.com',
]);

const toDisplayableSource = (rawSource) => {
  const source = rawSource?.web || rawSource || {};
  const rawUrl = source?.uri || source?.url || '';
  if (!rawUrl) return null;

  try {
    const parsedUrl = new URL(rawUrl);
    const hostname = parsedUrl.hostname.replace(/^www\./, '').toLowerCase();
    const isInternal = !hostname || INTERNAL_SOURCE_HOSTS.has(hostname);

    return {
      title: source?.title || source?.source || source?.name || (isInternal ? 'Search reference' : hostname),
      url: parsedUrl.toString(),
      snippet: source?.snippet || source?.description || '',
      hostname,
      isInternal,
    };
  } catch {
    return null;
  }
};

const normalizeWebSearchSources = (metadataOrSources) => {
  const rawSources = Array.isArray(metadataOrSources)
    ? metadataOrSources
    : metadataOrSources?.grounding_chunks || [];

  const preferredSources = [];
  const fallbackSources = [];
  const seenUrls = new Set();

  for (const rawSource of rawSources) {
    const source = toDisplayableSource(rawSource);
    if (!source || seenUrls.has(source.url)) continue;
    seenUrls.add(source.url);
    if (source.isInternal) {
      fallbackSources.push(source);
    } else {
      preferredSources.push(source);
    }
  }

  const chosenSources = preferredSources.length > 0
    ? preferredSources
    : fallbackSources.slice(0, Math.min(3, MAX_WEB_SOURCE_COUNT));

  return chosenSources.slice(0, MAX_WEB_SOURCE_COUNT).map(({ isInternal, hostname, ...source }) => {
    if (!source.title || source.title === 'Search reference') {
      return {
        ...source,
        title: hostname || source.title || 'Search reference',
      };
    }
    return source;
  });
};

const parseBackendCitations = (rawCitations) => {
  if (!rawCitations) return null;
  if (typeof rawCitations === 'string') {
    try {
      return JSON.parse(rawCitations);
    } catch {
      return null;
    }
  }
  return rawCitations;
};

const extractWebSearchAttachment = (rawCitations) => {
  const citations = parseBackendCitations(rawCitations);
  if (!citations || Array.isArray(citations)) return null;

  const attachment = citations?.web_search_attachment;
  if (!attachment || typeof attachment !== 'object') return null;

  return {
    answer: attachment.answer || '',
    sources: normalizeWebSearchSources(attachment.sources || []),
  };
};

const isUntitledSession = (session, currentFolderName) => {
  const sessionTitle = String(session?.title || '').trim();
  const folderTitle = String(session?.folderName || '').trim();
  const currentFolderTitle = String(currentFolderName || '').trim();
  return !sessionTitle || sessionTitle === 'New Chat' || sessionTitle === folderTitle || sessionTitle === currentFolderTitle;
};

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
  const saveTimeoutRef = useRef(null);
  const backendHydrationRef = useRef('');
  const hasHydratedWorkspaceRef = useRef(false);
  const lastFolderIdRef = useRef(selectedFolderId || '');

  const activeSession = useMemo(
    () => workspace.sessions.find((session) => session.id === workspace.currentSessionId) || null,
    [workspace.currentSessionId, workspace.sessions]
  );
  const messages = activeSession?.messages?.length ? activeSession.messages : [WELCOME_MESSAGE];
  const deferredMessages = useDeferredValue(messages);
  const activeSessionMessageCount = activeSession?.messages?.length ?? 0;
  const chatHistory = useMemo(
    () => (Array.isArray(workspace?.sessions) ? workspace.sessions : [])
      .filter(Boolean)
      .map((session) => ({
        ...session,
        messages: Array.isArray(session?.messages) ? session.messages : [],
      }))
      .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)),
    [workspace.sessions]
  );
  const hasPendingWebSearchMessage = messages.some((message) => message?.webSearchPending);
  const hasActiveStream = messages.some((message) => message?.isStreaming || message?.isStreamingWebSearch || message?.webSearchPending);
  const virtualItems = useMemo(() => {
    const baseItems = deferredMessages.map((message, index) => ({
      type: 'message',
      key: `message-${index}`,
      message,
      index,
    }));

    const lastMsg = deferredMessages[deferredMessages.length - 1];
    const isWaitingForFirstToken = !lastMsg || lastMsg.role !== 'assistant' || !lastMsg.content;
    const shouldShowTyping = loading && !lastMsg?.isStreaming && !hasPendingWebSearchMessage && isWaitingForFirstToken;

    if (shouldShowTyping) {
      baseItems.push({ type: 'typing', key: 'typing-indicator' });
    }

    return baseItems;
  }, [deferredMessages, hasPendingWebSearchMessage, loading]);

  const normalizeBackendMessages = useCallback((rawMessages = []) => {
    if (!Array.isArray(rawMessages)) return [];
    const result = [];
    for (const msg of rawMessages) {
      const webAttachment = extractWebSearchAttachment(msg.citations);
      if (msg.role === 'web_search') {
        // Attach web search answer to the previous assistant message
        const lastMsg = result[result.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          lastMsg.webSearchAnswer = msg.message || msg.content || '';
          lastMsg.isWebSearch = true;
          lastMsg.webSearchPending = false;
          // Parse citations JSON → webSearchSources array
          let sources = [];
          try {
            const raw = msg.citations || '[]';
            sources = typeof raw === 'string' ? JSON.parse(raw) : Array.isArray(raw) ? raw : [];
          } catch { sources = []; }
          lastMsg.webSearchSources = normalizeWebSearchSources(sources);
        }
        continue;
      }
      const normalizedMessage = {
        role: msg.role || 'assistant',
        content: msg.message || msg.content || '',
        citations: msg.citations || msg.sources || [],
        timestamp: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now(),
      };

      if (webAttachment) {
        normalizedMessage.webSearchAnswer = webAttachment.answer;
        normalizedMessage.webSearchSources = webAttachment.sources;
        normalizedMessage.isWebSearch = true;
        normalizedMessage.webSearchPending = false;
      }

      result.push(normalizedMessage);
    }
    return result;
  }, []);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const isStreamingUpdate = Boolean(lastMessage?.isStreaming || lastMessage?.isStreamingWebSearch || lastMessage?.webSearchPending);
    scrollToBottom(isStreamingUpdate ? 'auto' : 'smooth');
  }, [messages]);

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

  // 1. Initial workspace sync when user changes
  useEffect(() => {
    const syncFromBackend = async () => {
      if (!user?.id) return;
      setWorkspaceLoading(true);
      hasHydratedWorkspaceRef.current = false;
      try {
        const backendWorkspace = await chatService.syncWorkspaceFromBackend();
        if (backendWorkspace) {
          setWorkspace((prev) => {
            const backendSet = new Set(backendWorkspace.sessions.map((session) => session.id));
            const localSessionMap = new Map(prev.sessions.map((s) => [s.id, s]));
            
            const mergedSessions = [
              ...backendWorkspace.sessions.map((backendSession) => {
                const local = localSessionMap.get(backendSession.id);
                // Keep local messages if they exist (they might be fresher/full)
                if (local && (local.messages?.length > 1 || local.folderId)) return local;
                return backendSession;
              }),
              ...prev.sessions.filter((session) => !backendSet.has(session.id)),
            ];

            return {
              ...prev,
              sessions: mergedSessions,
              currentSessionId: prev.currentSessionId || backendWorkspace.currentSessionId || mergedSessions[0]?.id,
            };
          });
        }
      } catch (error) {
        console.error('Failed to sync from backend:', error);
      } finally {
        queueMicrotask(() => {
          hasHydratedWorkspaceRef.current = true;
          setWorkspaceLoading(false);
        });
      }
    };

    syncFromBackend();
  }, [user?.id]);

  // 2. Folder Context Sync: Switch/create session when folder selection changes
  useEffect(() => {
    if (!selectedFolderId || !hasHydratedWorkspaceRef.current || isWorkspaceLoading) {
      return;
    }

    const folderIdStr = String(selectedFolderId);
    if (lastFolderIdRef.current === folderIdStr) return;
    lastFolderIdRef.current = folderIdStr;

    setWorkspace((prev) => {
      const nextWorkspace = selectSessionForFolder(prev, folderIdStr, currentFolder?.name || '');
      // If a new session was created (wasn't original workspace), save it via effect hook
      return nextWorkspace;
    });
  }, [selectedFolderId, isWorkspaceLoading, currentFolder?.name]);

  // 2. LAZY HYDRATION: Fetch history only when a session is active but has no messages
  useEffect(() => {
    if (!hasHydratedWorkspaceRef.current || isWorkspaceLoading || !user?.id || !workspace.currentSessionId) {
      return;
    }

    const currentSession = workspace.sessions.find((s) => s.id === workspace.currentSessionId);
    // Only hydrate if we have no messages (except welcome) AND it's not a brand new local session
    const needsHydration = currentSession && (!currentSession.messages || currentSession.messages.length <= 1) && !currentSession.isLocalOnly;
    
    if (!needsHydration) return;

    const hydrationKey = `lazy:${user.id}:${workspace.currentSessionId}`;
    if (backendHydrationRef.current === hydrationKey) return;
    backendHydrationRef.current = hydrationKey;

    let cancelled = false;
    const loadActiveSessionHistory = async () => {
      try {
        const backendMessages = await chatService.getSessionHistory(workspace.currentSessionId, 200);
        if (cancelled || !Array.isArray(backendMessages) || backendMessages.length === 0) return;

        const normalized = normalizeBackendMessages(backendMessages);
        setWorkspace((prev) => {
          const session = prev.sessions.find((s) => s.id === workspace.currentSessionId);
          if (!session) return prev;

          return {
            ...prev,
            sessions: prev.sessions.map((s) =>
              s.id === workspace.currentSessionId ? { ...s, messages: normalized, updatedAt: Date.now() } : s
            ),
          };
        });
      } catch (error) {
        console.error('Lazy hydration failed:', error);
      }
    };

    loadActiveSessionHistory();
    return () => { cancelled = true; };
  }, [activeSessionMessageCount, isWorkspaceLoading, user?.id, workspace.currentSessionId, normalizeBackendMessages]);

  useEffect(() => {
    if (!hasHydratedWorkspaceRef.current) return;
    if (hasActiveStream) return;
    if (saveTimeoutRef.current) {
      if (typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(saveTimeoutRef.current);
      } else {
        clearTimeout(saveTimeoutRef.current);
      }
    }

    const persistWorkspaceIdle = () => {
      saveChatWorkspace(userKey, workspace);
      saveTimeoutRef.current = null;
    };

    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      saveTimeoutRef.current = window.requestIdleCallback(persistWorkspaceIdle, { timeout: 1200 });
    } else {
      saveTimeoutRef.current = setTimeout(persistWorkspaceIdle, 260);
    }

    return () => {
      if (saveTimeoutRef.current) {
        if (typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function') {
          window.cancelIdleCallback(saveTimeoutRef.current);
        } else {
          clearTimeout(saveTimeoutRef.current);
        }
      }
    };
  }, [workspace, userKey, hasActiveStream]);

  // Safety net: save workspace before page close/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (saveTimeoutRef.current) {
        if (typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function') {
          window.cancelIdleCallback(saveTimeoutRef.current);
        } else {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = null;
      }
      saveChatWorkspace(userKey, workspace);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [workspace, userKey]);

  const persistWorkspace = useCallback((nextWorkspace) => {
    setWorkspace(nextWorkspace);
    saveChatWorkspace(userKey, nextWorkspace);
  }, [userKey]);

  const updateCurrentSession = useCallback((updater) => {
    setWorkspace((prev) => {
      const current = prev.sessions.find((session) => session.id === prev.currentSessionId);
      if (!current) return prev;
      const nextSession = updater(current);
      // Update in-place — do NOT reorder sessions
      const sessions = prev.sessions.map((session) =>
        session.id === nextSession.id ? nextSession : session
      );
      return { currentSessionId: nextSession.id, sessions };
    });
  }, []);

  const updateMessageAtIndex = useCallback((index, updater) => {
    updateCurrentSession((session) => ({
      ...session,
      messages: session.messages.map((message, messageIndex) => (messageIndex === index ? updater(message) : message)),
      title: session.title || getSessionTitleFromMessages(session.messages, getDefaultSessionTitle(currentFolder?.name || 'New Chat')),
      updatedAt: Date.now(),
    }));
  }, [currentFolder?.name, updateCurrentSession]);

  const performWebSearch = useCallback(async ({ question, contextHint = '', messageIndex = null, appendMessage = false }) => {
    const searchQuery = (question || '').trim();
    if (!searchQuery) return;

    const fallbackContext = contextHint || currentFolder?.name || 'general';
    let appendedMessageIndex = null;

    if (typeof messageIndex === 'number') {
      updateMessageAtIndex(messageIndex, (message) => ({
        ...message,
        webSearchPending: true,
        webSearchAnswer: '',
        webSearchSources: [],
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
            content: '',
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

      if (typeof messageIndex === 'number') {
        updateMessageAtIndex(messageIndex, (message) => ({
          ...message,
          webSearchPending: false,
          webSearchAnswer: fullAnswer,
          webSearchSources: sources,
          isWebSearch: true,
          isStreamingWebSearch: false,
          webSearchQuery: searchQuery,
          webSearchContextHint: fallbackContext,
        }));
      } else if (appendMessage && typeof appendedMessageIndex === 'number') {
        updateMessageAtIndex(appendedMessageIndex, (message) => ({
          ...message,
          content: '',
          webSearchPending: false,
          webSearchAnswer: fullAnswer,
          webSearchSources: sources,
          isWebSearch: true,
          isStreamingWebSearch: false,
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
              content: '',
              isWebSearch: true,
              webSearchPending: false,
              webSearchAnswer: fullAnswer,
              isStreamingWebSearch: false,
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
  }, [
    currentFolder?.name,
    messages.length,
    updateCurrentSession,
    updateMessageAtIndex,
    workspace.currentSessionId,
  ]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    const nextSessionTitle = getSessionTitleFromMessages([...messages.filter((msg) => !msg.isWelcome), { role: 'user', content: userMessage }], currentFolder?.name || 'New Chat');

    // 1. Add user message + empty assistant placeholder (for streaming into)
    updateCurrentSession((session) => ({
      ...session,
      title: isUntitledSession(session, currentFolder?.name) ? nextSessionTitle : session.title,
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

      // 3. Read the NDJSON stream line by line with throttling
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream available');

      const decoder = new TextDecoder();
      let buffer = '';
      let streamedIntent = {};
      let streamedAlgorithm = null;
      let streamedResults = null;
      let suggestWebSearch = true;
      let accumulatedContent = '';
      let lastUpdateTimestamp = Date.now();

      const flushStreamingUpdate = (force = false) => {
        const now = Date.now();
        if (!force && now - lastUpdateTimestamp < 120) return;
        lastUpdateTimestamp = now;
        const chunkToApply = accumulatedContent;
        accumulatedContent = '';
        if (!chunkToApply) return;

        startTransition(() => {
          setWorkspace((prev) => {
            const session = prev.sessions.find((s) => s.id === prev.currentSessionId);
            if (!session) return prev;
            const msgs = [...session.messages];
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg?.role === 'assistant') {
              msgs[msgs.length - 1] = { ...lastMsg, content: lastMsg.content + chunkToApply };
            }
            return {
              ...prev,
              sessions: prev.sessions.map((s) =>
                s.id === prev.currentSessionId ? { ...s, messages: msgs } : s
              ),
            };
          });
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const chunk = JSON.parse(trimmed);

            switch (chunk.type) {
              case 'content':
                accumulatedContent += chunk.data;
                flushStreamingUpdate();
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
            }
          } catch { /* Silent skip */ }
        }
      }

      // 5. Finalize the assistant message: remove streaming flag, add metadata
      flushStreamingUpdate(true); // Final flush

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
            s.id === prev.currentSessionId ? { ...s, messages: msgs, updatedAt: Date.now(), isLocalOnly: false } : s
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
    nextSession.isLocalOnly = true;
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

      // Lazy-load from backend only when we truly have no persisted session content.
      if (!hasStoredChatContent(sessionMessages) && user?.id) {
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
                  messages: sessionMessages.length > 0 ? sessionMessages : entry.messages,
                  folderId: session.folderId || entry.folderId,
                  folderName: session.folderName || entry.folderName,
                }
              : entry
          ),
        };
        // Reset hydration ref so the lazy loader picks up the new selection
        backendHydrationRef.current = ''; 
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

  if (isWorkspaceLoading) {
    return (
      <div className="flex min-h-[calc(100vh-theme(spacing.16))] items-center justify-center p-6">
        <div className="w-full max-w-xs rounded-4xl border border-emerald-500/20 bg-card/80 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <h2 className="mt-6 text-lg font-black tracking-tight text-foreground">Initialising Environment</h2>
          <p className="mt-2 text-[13px] text-muted-foreground font-medium">Synchronising secure sessions...</p>
        </div>
      </div>
    );
  }

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
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={startNewChat} 
                className="gap-2 rounded-xl text-xs font-bold uppercase tracking-wider text-muted-foreground transition-all hover:bg-emerald-500/10 hover:text-emerald-500 border border-transparent hover:border-emerald-500/20 shadow-sm"
              >
                <SquarePen className="h-4 w-4" />
                New chat
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "gap-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border shadow-sm",
                  isHistoryOpen 
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 shadow-emerald-500/10" 
                    : "border-transparent text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/20"
                )}
                onClick={() => setHistoryOpen((v) => !v)}
                aria-expanded={isHistoryOpen}
                aria-controls="chat-history-drawer"
              >
                <PanelRightClose className="h-4 w-4" />
                {isHistoryOpen ? 'Hide history' : 'Open history'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearChat} 
                className="gap-2 rounded-xl border-border/40 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-all hover:bg-red-50 hover:text-red-500 hover:border-red-200 shadow-sm"
              >
                <RotateCcw className="h-4 w-4" />
                Clear chat
              </Button>
              <div className="relative" ref={downloadMenuRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 rounded-xl text-xs font-bold uppercase tracking-wider text-muted-foreground transition-all hover:bg-emerald-500/10 hover:text-emerald-500 border border-transparent hover:border-emerald-500/20 shadow-sm"
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

          <VirtualMessageList
            items={virtualItems}
            bottomRef={messagesEndRef}
            className="flex-1 overflow-y-auto px-4 py-5 lg:px-6"
            innerClassName="min-h-full"
            renderItem={(item) => {
              if (item.type === 'typing') {
                return (
                  <div className="pb-4">
                    <TypingIndicator />
                  </div>
                );
              }

              return (
                <div className="pb-4">
                  <MessageBubble message={item.message} onWebSearch={performWebSearch} messageIndex={item.index} />
                </div>
              );
            }}
          />

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
              <Suspense fallback={<ChatHistorySkeleton />}>
                <ChatHistoryPanel
                  chatHistory={chatHistory}
                  activeSessionId={workspace.currentSessionId}
                  onRestore={restoreSession}
                  onDelete={deleteSession}
                  onClose={() => setHistoryOpen(false)}
                  isLoading={isWorkspaceLoading}
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
            <Suspense fallback={<ChatHistorySkeleton />}>
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
