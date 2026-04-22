import React, { Suspense, startTransition, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { RotateCcw, PanelRightClose, Download, ChevronDown, SquarePen, Globe, Loader2, Sprout, Leaf } from 'lucide-react';
import { MessageBubble, TypingIndicator } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { VirtualMessageList } from './components/VirtualMessageList';
import { ChatDownloadModal } from './components/ChatDownloadModal';
import { ChatAnswerDetailsDrawer } from './components/ChatAnswerDetailsDrawer';
import { ConfirmationModal } from './components/ConfirmationModal';
const ChatHistoryPanel = React.lazy(() =>
  import('./ChatHistoryPanel').then((m) => ({ default: m.ChatHistoryPanel }))
);
import api from '../../services/api';
import chatService from '../../services/chatService';
import { useGlobalFolder } from '../../contexts/GlobalFolderContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChatHistorySkeleton } from './components/ChatHistorySkeleton';
import { cn } from '../../utils/cn';
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
const CHAT_STARTUP_SYNC_TIMEOUT_MS = 8000;
const CHAT_HISTORY_SEND_WINDOW = 20;
const CHAT_QUICK_PROMPTS = [
  'Summarize key entities in this folder',
  'What changed most recently in this knowledge graph?',
  'Show the strongest relationships and why they matter',
];
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
  const [workspace, setWorkspace] = useState({ currentSessionId: null, sessions: [] });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHistoryOpen, setHistoryOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1280 : false));
  const [isDownloadOpen, setDownloadOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [detailsMessageIndex, setDetailsMessageIndex] = useState(null);
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
  const [isWorkspaceLoading, setWorkspaceLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const downloadMenuRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const streamBufferRef = useRef('');
  const streamFlushTimerRef = useRef(null);
  const wsRef = useRef(null);
  const wsStateRef = useRef({ status: 'idle' });
  const wsRequestIdRef = useRef(null);
  const wsChunkCountRef = useRef(0);
  const wsLastErrorRef = useRef('');
  const backendHydrationRef = useRef('');
  const hasHydratedWorkspaceRef = useRef(false);
  const lastFolderIdRef = useRef(selectedFolderId || '');
  const attemptedSessionsHydrationRef = useRef(new Set());

  const activeSession = useMemo(
    () => workspace.sessions.find((session) => session.id === workspace.currentSessionId) || null,
    [workspace.currentSessionId, workspace.sessions]
  );
  const messages = activeSession?.messages?.length ? activeSession.messages : [WELCOME_MESSAGE];
  const detailsMessage = typeof detailsMessageIndex === 'number' ? messages[detailsMessageIndex] || null : null;
  const activeSessionMessageCount = activeSession?.messages?.length ?? 0;
  const deferredMessages = useDeferredValue(messages);
  
  const chatHistory = useMemo(() => {
    const rawSessions = Array.isArray(workspace?.sessions) ? workspace.sessions : [];
    return rawSessions
      .filter(Boolean)
      .map((s) => ({
        id: s.id,
        title: s.title,
        folderName: s.folderName,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        messageCount: s.messages?.length || 0,
        messages: s.messages?.length > 1 ? [s.messages.find(m => !m.isWelcome), s.messages[s.messages.length - 1]].filter(Boolean) : (s.messages || [])
      }))
      .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
  }, [workspace.sessions]);

  const hasPendingWebSearchMessage = messages.some((message) => message?.webSearchPending);
  
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
        const lastMsg = result[result.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          lastMsg.webSearchAnswer = msg.message || msg.content || '';
          lastMsg.isWebSearch = true;
          lastMsg.webSearchPending = false;
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

  const updateCurrentSession = useCallback((updater) => {
    setWorkspace((prev) => {
      const current = prev.sessions.find((session) => session.id === prev.currentSessionId);
      if (!current) return prev;
      const nextSession = updater(current);
      const sessions = prev.sessions.map((session) => session.id === nextSession.id ? nextSession : session);
      return { ...prev, sessions };
    });
  }, []);

  const updateMessageAtIndex = useCallback((index, updater) => {
    updateCurrentSession((session) => ({
      ...session,
      messages: session.messages.map((message, messageIdx) => messageIdx === index ? updater(message) : message),
      title: session.title || getSessionTitleFromMessages(session.messages, getDefaultSessionTitle(currentFolder?.name || 'New Research')),
      updatedAt: Date.now(),
    }));
  }, [currentFolder?.name, updateCurrentSession]);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior });
    }
  }, []);

  const openMessageDetails = useCallback((messageIndex) => {
    setDetailsMessageIndex(messageIndex);
    setHistoryOpen(false);
  }, []);

  const startNewChat = useCallback(() => {
    setWorkspace((prev) => {
      const newSession = createBlankSession(currentFolder?.name || 'New Research', selectedFolderId);
      return {
        ...prev,
        currentSessionId: newSession.id,
        sessions: [newSession, ...prev.sessions],
      };
    });
    setInput('');
  }, [currentFolder?.name, selectedFolderId]);

  const handleDeleteSession = useCallback((sessionId) => {
    setDeleteConfirmId(sessionId);
  }, []);

  const confirmDeleteSession = useCallback(() => {
    if (!deleteConfirmId) return;
    const sessionId = deleteConfirmId;
    setWorkspace((prev) => {
      const nextSessions = prev.sessions.filter((s) => s.id !== sessionId);
      let nextId = prev.currentSessionId;
      if (nextId === sessionId) {
        nextId = nextSessions[0]?.id || null;
      }
      removeSession(storageKey, sessionId);
      return {
        ...prev,
        currentSessionId: nextId,
        sessions: nextSessions,
      };
    });
    toast.success('Session pruned.');
    setDeleteConfirmId(null);
  }, [deleteConfirmId, storageKey]);

  const clearChat = useCallback(() => {
    setIsClearConfirmOpen(true);
  }, []);

  const confirmClearChat = useCallback(() => {
    updateCurrentSession((session) => ({
      ...session,
      messages: [WELCOME_MESSAGE],
      updatedAt: Date.now(),
    }));
    toast.success('Session cleared.');
    setIsClearConfirmOpen(false);
  }, [updateCurrentSession]);

  const exportChat = useCallback((format) => {
    // Basic export logic preservation
    toast.success(`Exporting findings as ${format.toUpperCase()}...`);
    setDownloadOpen(false);
  }, []);

  // Workspace hydration/sync logic preserved
  useEffect(() => {
    if (!userKey) return;
    setWorkspaceLoading(true);
    hasHydratedWorkspaceRef.current = false;
    const timer = setTimeout(() => {
      try {
        const hydratedWorkspace = loadChatWorkspace(userKey);
        setWorkspace(hydratedWorkspace);
        hasHydratedWorkspaceRef.current = true;
      } catch (err) {
        console.error('Hydration failed:', err);
      } finally {
        setWorkspaceLoading(false);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [userKey]);

  useEffect(() => {
    const syncFromBackend = async () => {
      if (!user?.id) return;
      let attempts = 0;
      while (!hasHydratedWorkspaceRef.current && attempts < 20) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }
      try {
        const backendWorkspace = await chatService.syncWorkspaceFromBackend({ timeoutMs: CHAT_STARTUP_SYNC_TIMEOUT_MS });
        if (backendWorkspace) {
          setWorkspace((prev) => {
            const backendSet = new Set(backendWorkspace.sessions.map((session) => session.id));
            const localSessionMap = new Map(prev.sessions.map((s) => [s.id, s]));
            const folderSessionMap = new Map();
            prev.sessions.forEach(s => { if (s.folderId) folderSessionMap.set(s.folderId, s); });

            const mergedSessions = [
              ...backendWorkspace.sessions.map((backendSession) => {
                const localById = localSessionMap.get(backendSession.id);
                if (localById && (localById.messages?.length > 1 || localById.folderId)) return localById;
                const localByFolder = backendSession.folderId ? folderSessionMap.get(backendSession.folderId) : null;
                if (localByFolder && localByFolder.messages?.length <= 1) return { ...backendSession, id: localByFolder.id || backendSession.id };
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
      } catch (error) { console.error('Sync failed:', error); }
    };
    syncFromBackend();
  }, [user?.id]);

  useEffect(() => {
    const loadSessionContent = async () => {
      if (!workspace.currentSessionId || isWorkspaceLoading || !user?.id) return;
      const session = workspace.sessions.find(s => s.id === workspace.currentSessionId);
      
      const localCount = session?.messages?.filter(m => !m.isWelcome).length || 0;
      const backendCount = session?.messageCount || 0;
      const isTrimmed = localCount <= 2 && backendCount > localCount;
      const isEmpty = localCount === 0;

      if (session && (isEmpty || isTrimmed) && !attemptedSessionsHydrationRef.current.has(workspace.currentSessionId)) {
        attemptedSessionsHydrationRef.current.add(workspace.currentSessionId);
        try {
          const rawMessages = await chatService.getSessionHistory(workspace.currentSessionId);
          if (rawMessages && rawMessages.length > 0) {
            const normalized = normalizeBackendMessages(rawMessages);
            setWorkspace(prev => ({
              ...prev,
              sessions: prev.sessions.map(s => s.id === workspace.currentSessionId ? { ...s, messages: normalized, messageCount: rawMessages.length } : s)
            }));
          }
        } catch (error) {
          console.error('Failed to load session history:', error);
        }
      }
    };
    loadSessionContent();
  }, [workspace.currentSessionId, workspace.sessions, isWorkspaceLoading, user?.id, normalizeBackendMessages]);

  useEffect(() => {
    if (isWorkspaceLoading || !hasHydratedWorkspaceRef.current) return;
    const folderIdStr = selectedFolderId ? String(selectedFolderId) : '';
    setWorkspace((prev) => {
      if (prev.currentSessionId) {
        const session = prev.sessions.find(s => s.id === prev.currentSessionId);
        if (session && String(session.folderId || '') === folderIdStr) return prev;
      }
      return selectSessionForFolder(prev, folderIdStr, currentFolder?.name || '');
    });
  }, [selectedFolderId, isWorkspaceLoading, currentFolder?.name]);

  useEffect(() => {
    if (isWorkspaceLoading || !hasHydratedWorkspaceRef.current || !userKey) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveChatWorkspace(userKey, workspace);
    }, 800);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [workspace, userKey, isWorkspaceLoading]);


  const performWebSearch = useCallback(async ({ question, contextHint = '', messageIndex = null, appendMessage = false }) => {
    const searchQuery = (question || '').trim();
    if (!searchQuery) return;
    const fallbackContext = contextHint || currentFolder?.name || 'general';
    let appendedMessageIndex = null;
    if (typeof messageIndex === 'number') {
      updateMessageAtIndex(messageIndex, (message) => ({ ...message, webSearchPending: true, isWebSearch: true, webSearchQuery: searchQuery, webSearchContextHint: fallbackContext }));
    } else if (appendMessage) {
      appendedMessageIndex = messages.length;
      updateCurrentSession((session) => ({
        ...session,
        messages: [...session.messages, { role: 'assistant', content: '', isWebSearch: true, webSearchPending: true, webSearchQuery: searchQuery, webSearchContextHint: fallbackContext }],
        updatedAt: Date.now(),
      }));
    }
    setLoading(true);
    try {
      const response = await api.post('/combined-chat/web-search', { question: searchQuery, context_hint: fallbackContext, session_id: workspace.currentSessionId || null });
      const fullAnswer = response.data?.answer || response.data?.response || 'No findings available.';
      const sources = normalizeWebSearchSources(response.data?.grounding_metadata);
      if (typeof messageIndex === 'number') {
        updateMessageAtIndex(messageIndex, (message) => ({ ...message, webSearchPending: false, webSearchAnswer: fullAnswer, webSearchSources: sources, isStreamingWebSearch: false }));
      } else if (appendMessage && typeof appendedMessageIndex === 'number') {
        updateMessageAtIndex(appendedMessageIndex, (message) => ({ ...message, webSearchPending: false, webSearchAnswer: fullAnswer, webSearchSources: sources, isStreamingWebSearch: false }));
      }
    } catch { toast.error('Web pollination failed.'); } finally { setLoading(false); }
  }, [currentFolder?.name, messages.length, updateCurrentSession, updateMessageAtIndex, workspace.currentSessionId]);

  const sendMessage = async (e, overrideMessage = null) => {
    e.preventDefault();
    const draft = typeof overrideMessage === 'string' ? overrideMessage : input;
    if (!draft.trim() || loading) return;
    const userMessage = draft.trim();
    setInput('');
    const nextSessionTitle = getSessionTitleFromMessages([...messages.filter(m => !m.isWelcome), { role: 'user', content: userMessage }], currentFolder?.name || 'New Research');
    updateCurrentSession((session) => ({
      ...session,
      title: isUntitledSession(session, currentFolder?.name) ? nextSessionTitle : session.title,
      folderId: selectedFolderId ? String(selectedFolderId) : session.folderId,
      messages: [...session.messages, { role: 'user', content: userMessage }, { role: 'assistant', content: '', isStreaming: true }],
      updatedAt: Date.now(),
    }));
    setLoading(true);
    try {
      const flushStreamBuffer = () => {
        if (!streamBufferRef.current) return;
        const pending = streamBufferRef.current;
        streamBufferRef.current = '';
        setWorkspace((prev) => {
          const s = prev.sessions.find((x) => x.id === prev.currentSessionId);
          if (!s || !s.messages?.length) return prev;
          const msgs = [...s.messages];
          const lastIdx = msgs.length - 1;
          msgs[lastIdx] = { ...msgs[lastIdx], content: (msgs[lastIdx].content || '') + pending };
          return {
            ...prev,
            sessions: prev.sessions.map((x) => (x.id === prev.currentSessionId ? { ...x, messages: msgs } : x)),
          };
        });
      };

      const scheduleStreamFlush = () => {
        if (streamFlushTimerRef.current) return;
        streamFlushTimerRef.current = window.setTimeout(() => {
          streamFlushTimerRef.current = null;
          flushStreamBuffer();
        }, 45);
      };

      const activeMessages = messages.filter(m => !m.isWelcome).map(m => ({ role: m.role, content: m.content }));
      const token = localStorage.getItem('neural_nexus_token');
      const ws = wsRef.current;
      const canUseWs = ws && ws.readyState === WebSocket.OPEN;
      const streamViaHttp = async () => {
        const response = await fetch('/api/v1/combined-chat/stream-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            question: userMessage,
            folder_id: selectedFolderId || null,
            session_id: workspace.currentSessionId || null,
            history: activeMessages.slice(-CHAT_HISTORY_SEND_WINDOW),
            web_search: isWebSearchEnabled,
          }),
        });
        if (!response.ok) throw new Error('Network fault');
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split('\n');
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const chunk = JSON.parse(line);
              if (chunk.type === 'content') {
                streamBufferRef.current += chunk.data;
                scheduleStreamFlush();
              }
            } catch { /* parse fail */ }
          }
        }
      };

      if (canUseWs) {
        const requestId =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        wsChunkCountRef.current = 0;
        wsLastErrorRef.current = '';
        wsRequestIdRef.current = requestId;
        ws.send(
          JSON.stringify({
            type: 'chat_stream',
            request_id: requestId,
            question: userMessage,
            folder_id: selectedFolderId || null,
            session_id: workspace.currentSessionId || null,
            history: activeMessages.slice(-CHAT_HISTORY_SEND_WINDOW),
            web_search: isWebSearchEnabled,
          })
        );

        // Wait until ws handler marks this request as done/error.
        const startedAt = Date.now();
        while (wsRequestIdRef.current === requestId) {
          await new Promise((r) => setTimeout(r, 40));
          // Safety: avoid hanging if server doesn't reply.
          if (Date.now() - startedAt > 180000) {
            throw new Error('WebSocket stream timeout');
          }
        }
        if (wsLastErrorRef.current || wsChunkCountRef.current === 0) {
          await streamViaHttp();
        }
      } else {
        await streamViaHttp();
      }
      if (streamFlushTimerRef.current) {
        clearTimeout(streamFlushTimerRef.current);
        streamFlushTimerRef.current = null;
      }
      if (streamBufferRef.current) {
        const pending = streamBufferRef.current;
        streamBufferRef.current = '';
        setWorkspace((prev) => {
          const s = prev.sessions.find((x) => x.id === prev.currentSessionId);
          if (!s || !s.messages?.length) return prev;
          const msgs = [...s.messages];
          const lastIdx = msgs.length - 1;
          msgs[lastIdx] = { ...msgs[lastIdx], content: (msgs[lastIdx].content || '') + pending };
          return {
            ...prev,
            sessions: prev.sessions.map((x) => (x.id === prev.currentSessionId ? { ...x, messages: msgs } : x)),
          };
        });
      }
      setWorkspace(prev => ({ ...prev, sessions: prev.sessions.map(s => s.id === workspace.currentSessionId ? { ...s, messages: s.messages.map((m, i) => i === s.messages.length - 1 ? { ...m, isStreaming: false } : m) } : s) }));
    } catch { toast.error('Synthesis interrupted.'); } finally { setLoading(false); }
  };

  const sendQuickPrompt = async (prompt) => {
    if (!prompt || loading) return;
    const synthetic = { preventDefault: () => {} };
    await sendMessage(synthetic, prompt);
  };

  useEffect(() => {
    const token = localStorage.getItem('neural_nexus_token');
    if (!token) return;

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}/api/v1/ws?token=${encodeURIComponent(token)}`;
    let ws;
    try {
      ws = new WebSocket(wsUrl);
    } catch {
      return;
    }
    wsRef.current = ws;
    wsStateRef.current = { status: 'connecting' };

    const flushStreamBuffer = () => {
      if (!streamBufferRef.current) return;
      const pending = streamBufferRef.current;
      streamBufferRef.current = '';
      setWorkspace((prev) => {
        const s = prev.sessions.find((x) => x.id === prev.currentSessionId);
        if (!s || !s.messages?.length) return prev;
        const msgs = [...s.messages];
        const lastIdx = msgs.length - 1;
        msgs[lastIdx] = { ...msgs[lastIdx], content: (msgs[lastIdx].content || '') + pending };
        return {
          ...prev,
          sessions: prev.sessions.map((x) => (x.id === prev.currentSessionId ? { ...x, messages: msgs } : x)),
        };
      });
    };

    const scheduleStreamFlush = () => {
      if (streamFlushTimerRef.current) return;
      streamFlushTimerRef.current = window.setTimeout(() => {
        streamFlushTimerRef.current = null;
        flushStreamBuffer();
      }, 45);
    };

    ws.onopen = () => {
      wsStateRef.current = { status: 'open' };
      try {
        ws.send(JSON.stringify({ type: 'ping' }));
      } catch {
        // ignore
      }
    };
    ws.onclose = () => {
      wsStateRef.current = { status: 'closed' };
      if (wsRequestIdRef.current) {
        wsLastErrorRef.current = 'socket_closed';
        wsRequestIdRef.current = null;
      }
      if (wsRef.current === ws) wsRef.current = null;
    };
    ws.onerror = () => {
      wsStateRef.current = { status: 'error' };
      if (wsRequestIdRef.current) {
        wsLastErrorRef.current = 'socket_error';
        wsRequestIdRef.current = null;
      }
    };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(String(event.data || '{}'));
        const requestId = msg?.request_id ?? null;
        if (requestId && wsRequestIdRef.current && requestId !== wsRequestIdRef.current) {
          return;
        }
        if (msg?.type === 'chat_chunk') {
          const payload = msg?.data || {};
          if (payload?.type === 'content' && typeof payload?.data === 'string') {
            wsChunkCountRef.current += 1;
            streamBufferRef.current += payload.data;
            scheduleStreamFlush();
          }
        } else if (msg?.type === 'chat_done') {
          wsRequestIdRef.current = null;
        } else if (msg?.type === 'chat_error') {
          wsLastErrorRef.current = String(msg?.message || 'chat_error');
          wsRequestIdRef.current = null;
        } else if (msg?.type === 'error') {
          wsLastErrorRef.current = String(msg?.message || 'error');
          wsRequestIdRef.current = null;
        }
      } catch {
        // ignore parse errors
      }
    };

    return () => {
      if (streamFlushTimerRef.current) {
        clearTimeout(streamFlushTimerRef.current);
      }
      try {
        wsRequestIdRef.current = null;
        if (wsRef.current) wsRef.current.close();
      } catch {
        // ignore
      }
    };
  }, []);

  return (
    <div className="flex h-full w-full overflow-hidden bg-transparent">
      {/* Search/History Sidebar (The Repository Stash) */}
      <Suspense fallback={<ChatHistorySkeleton />}>
        {isHistoryOpen && (
          <div className="app-surface-muted hidden h-full xl:block xl:w-80 py-5 pl-1 pr-4">
            <ChatHistoryPanel
              chatHistory={chatHistory}
              activeSessionId={workspace.currentSessionId}
              onRestore={(id) => setWorkspace((prev) => ({ ...prev, currentSessionId: id }))}
              onDelete={handleDeleteSession}
              onClose={() => setHistoryOpen(false)}
              isLoading={isWorkspaceLoading}
            />
          </div>
        )}
      </Suspense>

      {/* Main Chat Interface (Neural Studio) */}
      <div className="relative flex h-full flex-1 flex-col overflow-hidden px-4 py-5">
        <div className="app-surface app-elevated flex h-full flex-col overflow-hidden rounded-[28px]">
          
          {/* Header Area */}
          <div className="app-surface-muted flex h-20 shrink-0 items-center justify-between px-10">
            <div className="flex items-center gap-4 min-w-0">
               <button
                onClick={() => setHistoryOpen(!isHistoryOpen)}
                className="group flex h-11 w-11 items-center justify-center rounded-[14px] bg-secondary/50 text-muted-foreground/80 transition hover:bg-primary hover:text-primary-foreground"
                title={isHistoryOpen ? "Focus Workspace" : "Explore Repository"}
              >
                <PanelRightClose className={cn("h-5.5 w-5.5 transition-transform duration-700", !isHistoryOpen && "rotate-180")} />
              </button>
                <div className="flex flex-col min-w-0">
                  <h2 className="text-xl font-black tracking-tighter text-foreground uppercase">
                    Chat
                  </h2>
                </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative" ref={downloadMenuRef}>
                <button
                  onClick={() => setDownloadOpen(!isDownloadOpen)}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-foreground/80 transition hover:border-primary/40 hover:text-primary"
                >
                  <Download className="h-4.5 w-4.5" />
                  <span className="hidden md:inline">Export Findings</span>
                </button>
              </div>

              <button
                onClick={startNewChat}
                className="flex items-center gap-3 rounded-xl bg-primary px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 active:scale-[0.98]"
              >
                <SquarePen className="h-4.5 w-4.5" />
                <span className="hidden md:inline">New Session</span>
              </button>
              
              <button
                onClick={clearChat}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20 transition hover:bg-destructive hover:text-destructive-foreground"
                title="Clear Session"
              >
                <RotateCcw className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Message Stream Container */}
          <div className="relative flex-1 overflow-hidden bg-gradient-to-b from-transparent via-transparent to-primary/5">
            {messages.length <= 1 && !loading ? (
              <div className="px-8 pt-6 pb-2">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">Quick start</p>
                <div className="flex flex-wrap gap-2">
                  {CHAT_QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendQuickPrompt(prompt)}
                      className="rounded-full border border-primary/25 bg-primary/8 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/14"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <VirtualMessageList
              messages={virtualItems}
              onWebSearch={performWebSearch}
              onOpenDetails={openMessageDetails}
            />
            {/* Ambient Bottom Fade */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background/75 to-transparent z-10" />
          </div>

          {/* Input Area */}
          <ChatInput
            input={input}
            setInput={setInput}
            onSubmit={sendMessage}
            onWebSearch={(q) => performWebSearch({ question: q, appendMessage: true })}
            loading={loading}
            inputRef={inputRef}
            isWebSearchEnabled={isWebSearchEnabled}
            setIsWebSearchEnabled={setIsWebSearchEnabled}
          />
        </div>
      </div>

      <ChatDownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setDownloadOpen(false)}
        messages={messages}
      />

      <ChatAnswerDetailsDrawer
        isOpen={detailsMessageIndex !== null}
        onClose={() => setDetailsMessageIndex(null)}
        message={detailsMessage}
      />
      <ConfirmationModal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDeleteSession}
        title="Prune Session"
        description="This research path will be permanently deleted from the repository stash."
        confirmText="Prune"
      />

      <ConfirmationModal
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={confirmClearChat}
        title="Flush Session"
        description="All messages in this active stream will be cleared. This cannot be undone."
        confirmText="Flush"
      />
    </div>
  );
}
