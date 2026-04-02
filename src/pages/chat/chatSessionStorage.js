const STORAGE_PREFIX = 'neural_nexus_chat_sessions_v3';
const MAX_SESSION_COUNT = 24;
const MAX_SOURCE_COUNT = 6;
const MAX_RESULTS_COUNT = 20;
const MAX_TEXT_LENGTH = 12000;

export const WELCOME_MESSAGE = {
  role: 'assistant',
  isWelcome: true,
  content: "Hello! I'm your AI chat assistant with RAG and web search. Ask anything about your knowledge graph or general domain, and you'll get full answers from the backend.",
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
};

const safeJsonParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeUserKey = (userKey) => {
  const raw = String(userKey || 'anonymous').trim().toLowerCase();
  return raw.replace(/[^a-z0-9._-]/g, '_');
};

export const getChatStorageKey = (userKey) => `${STORAGE_PREFIX}:${normalizeUserKey(userKey)}`;

export const getDefaultSessionTitle = (folderName = 'New Chat') => folderName || 'New Chat';

export const getSessionTitleFromMessages = (messages = [], fallback = 'New Chat') => {
  const firstUserMessage = messages.find((message) => message?.role === 'user' && String(message?.content || '').trim());
  const content = String(firstUserMessage?.content || '').trim();

  if (!content) return fallback;
  return content.length > 42 ? `${content.slice(0, 42).trim()}…` : content;
};

export const createChatSession = ({ folderId = '', folderName = '', title, messages } = {}) => {
  const sessionMessages = Array.isArray(messages) && messages.length > 0 ? messages : [WELCOME_MESSAGE];
  const createdAt = Date.now();

  return {
    id: generateId(),
    folderId: folderId ? String(folderId) : '',
    folderName: folderName || '',
    title: title || getSessionTitleFromMessages(sessionMessages, getDefaultSessionTitle(folderName)),
    createdAt,
    updatedAt: createdAt,
    messages: sessionMessages,
  };
};

export const loadChatWorkspace = (userKey) => {
  const storageKey = getChatStorageKey(userKey);
  if (typeof localStorage === 'undefined') {
    const session = createChatSession();
    return { currentSessionId: session.id, sessions: [session] };
  }

  let raw = null;
  try {
    raw = localStorage.getItem(storageKey);
  } catch {
    const session = createChatSession();
    return { currentSessionId: session.id, sessions: [session] };
  }
  if (!raw) {
    const session = createChatSession();
    return { currentSessionId: session.id, sessions: [session] };
  }

  const parsed = safeJsonParse(raw, null);
  if (!parsed || typeof parsed !== 'object') {
    const session = createChatSession();
    return { currentSessionId: session.id, sessions: [session] };
  }

  const sessions = Array.isArray(parsed.sessions)
    ? parsed.sessions
        .filter(Boolean)
        .map((session) => ({
          id: String(session.id || generateId()),
          folderId: session.folderId ? String(session.folderId) : '',
          folderName: session.folderName || '',
          title: session.title || getSessionTitleFromMessages(session.messages || [], getDefaultSessionTitle(session.folderName || 'New Chat')),
          createdAt: Number(session.createdAt || Date.now()),
          updatedAt: Number(session.updatedAt || session.createdAt || Date.now()),
          messages: Array.isArray(session.messages) && session.messages.length > 0 ? session.messages : [WELCOME_MESSAGE],
        }))
    : [];

  if (sessions.length === 0) {
    const session = createChatSession();
    return { currentSessionId: session.id, sessions: [session] };
  }

  const requestedCurrentSessionId = String(parsed.currentSessionId || '');
  const hasRequestedCurrentSession = sessions.some((session) => session.id === requestedCurrentSessionId);

  // Prefer the explicitly saved current session so refreshes do not unexpectedly switch chats.
  const currentSessionId = hasRequestedCurrentSession
    ? requestedCurrentSessionId
    : sessions.slice().sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))[0]?.id || sessions[0].id;

  return {
    currentSessionId,
    sessions,
  };
};

export const saveChatWorkspace = (userKey, workspace) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(getChatStorageKey(userKey), JSON.stringify(serializeWorkspace(workspace)));
  } catch {
    try {
      const reducedWorkspace = serializeWorkspace(workspace, { aggressive: true });
      localStorage.setItem(getChatStorageKey(userKey), JSON.stringify(reducedWorkspace));
    } catch {
      // Ignore storage failures so the UI never crashes.
    }
  }
};

const clampText = (value, maxLength = MAX_TEXT_LENGTH) => {
  const text = String(value || '');
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

const serializeMessage = (message, options = {}) => {
  const aggressive = Boolean(options.aggressive);
  const base = {
    role: message?.role || 'assistant',
    content: clampText(message?.content || '', aggressive ? 4000 : MAX_TEXT_LENGTH),
    isWelcome: Boolean(message?.isWelcome),
    isError: Boolean(message?.isError),
    isWebSearch: Boolean(message?.isWebSearch),
    webSearchPending: Boolean(message?.webSearchPending),
    webSearchSuggested: Boolean(message?.webSearchSuggested),
    webSearchQuery: message?.webSearchQuery || '',
    webSearchContextHint: message?.webSearchContextHint || '',
    contextSummary: clampText(message?.contextSummary || '', aggressive ? 800 : 2000),
    algorithm: message?.algorithm || null,
  };

  if (message?.webSearchAnswer) {
    base.webSearchAnswer = clampText(message.webSearchAnswer, aggressive ? 3000 : 9000);
  }

  if (Array.isArray(message?.webSearchSources) && message.webSearchSources.length > 0) {
    base.webSearchSources = message.webSearchSources.slice(0, MAX_SOURCE_COUNT).map((source) => ({
      title: clampText(source?.title || source?.name || source?.url || 'Source', 180),
      url: source?.url || source?.uri || '',
      snippet: clampText(source?.snippet || '', aggressive ? 120 : 280),
    }));
  }

  if (!aggressive && Array.isArray(message?.sources) && message.sources.length > 0) {
    base.sources = message.sources.slice(0, MAX_SOURCE_COUNT).map((source) => ({
      node_type: source?.node_type || source?.type || '',
      node_name: clampText(source?.node_name || source?.name || '', 120),
    }));
  }

  if (!aggressive && Array.isArray(message?.results) && message.results.length > 0) {
    base.results = message.results.slice(0, MAX_RESULTS_COUNT);
  }

  return base;
};

const serializeWorkspace = (workspace, options = {}) => {
  const currentSessionId = workspace?.currentSessionId;
  const sessions = (workspace?.sessions || [])
    .slice(0, MAX_SESSION_COUNT)
    .map((session) => {
      const isCurrent = session.id === currentSessionId;
      // LAZY PERSISTENCE: Only store full history for the active session.
      // For background sessions, we only store the metadata to keep localStorage "thin".
      // This prevents the "Page Unresponsive" error during JSON.stringify.
      return {
        id: String(session?.id || createChatSession().id),
        folderId: session?.folderId ? String(session.folderId) : '',
        folderName: session?.folderName || '',
        title: session?.title || getDefaultSessionTitle(session?.folderName || 'New Chat'),
        createdAt: Number(session?.createdAt || Date.now()),
        updatedAt: Number(session?.updatedAt || session?.createdAt || Date.now()),
        messages: isCurrent
          ? (Array.isArray(session?.messages) ? session.messages.map((message) => serializeMessage(message, options)) : [WELCOME_MESSAGE])
          : (Array.isArray(session?.messages) && session.messages.some(m => !m.isWelcome) 
              ? [session.messages.find(m => !m.isWelcome), ...session.messages.slice(-1)].filter(Boolean).map(m => serializeMessage(m, { ...options, aggressive: true }))
              : [WELCOME_MESSAGE]),
      };
    });

  const finalCurrentId = sessions.some((session) => session.id === currentSessionId)
    ? currentSessionId
    : sessions[0]?.id || createChatSession().id;

  return {
    currentSessionId: finalCurrentId,
    sessions,
  };
};

export const upsertSession = (workspace, session) => {
  const nextSession = {
    ...session,
    title: session.title || getSessionTitleFromMessages(session.messages || [], getDefaultSessionTitle(session.folderName || 'New Chat')),
    updatedAt: Date.now(),
  };

  const sessions = [nextSession, ...(workspace.sessions || []).filter((item) => item.id !== nextSession.id)];
  return {
    currentSessionId: workspace.currentSessionId || nextSession.id,
    sessions,
  };
};

export const replaceSessionMessages = (workspace, sessionId, messages, patch = {}) => {
  const sessions = (workspace.sessions || []).map((session) => {
    if (session.id !== sessionId) return session;
    return {
      ...session,
      ...patch,
      messages,
      title: patch.title || session.title || getSessionTitleFromMessages(messages, getDefaultSessionTitle(patch.folderName || session.folderName || 'New Chat')),
      updatedAt: Date.now(),
    };
  });

  return {
    ...workspace,
    sessions,
  };
};

export const createBlankSession = ({ folderId = '', folderName = '' } = {}) =>
  createChatSession({ folderId, folderName, messages: [WELCOME_MESSAGE] });

export const selectSessionForFolder = (workspace, folderId, folderName = '') => {
  const folderKey = folderId ? String(folderId) : '';
  const matchingSessions = (workspace.sessions || [])
    .filter((session) => String(session.folderId || '') === folderKey)
    .sort((a, b) => Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0));

  if (matchingSessions.length > 0) {
    return {
      ...workspace,
      currentSessionId: matchingSessions[0].id,
    };
  }

  const newSession = createBlankSession({ folderId, folderName });
  return {
    currentSessionId: newSession.id,
    sessions: [newSession, ...(workspace.sessions || [])],
  };
};

export const removeSession = (workspace, sessionId) => {
  const sessions = (workspace.sessions || []).filter((session) => session.id !== sessionId);
  const nextCurrent = workspace.currentSessionId === sessionId ? (sessions[0]?.id || '') : workspace.currentSessionId;
  if (sessions.length === 0) {
    const fallback = createBlankSession();
    return {
      currentSessionId: fallback.id,
      sessions: [fallback],
    };
  }

  return {
    currentSessionId: nextCurrent,
    sessions,
  };
};
