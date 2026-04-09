import React from 'react';
import { Button } from '../../components/ui/Button';
import { Trash2, Clock, X, History } from 'lucide-react';
import { SkeletonText } from '../../components/ui/Skeleton';

export const ChatHistoryPanel = React.memo(function ChatHistoryPanel({ chatHistory, onRestore, onDelete, onClose, activeSessionId, isLoading }) {
  const safeHistory = Array.isArray(chatHistory) ? chatHistory : [];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[26px] border border-border/50 bg-card/92 shadow-[0_24px_70px_-50px_rgba(25,119,65,0.24)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3 border-b border-border/40 px-4 py-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <History className="h-4 w-4" />
            Chat History
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Open any saved conversation and continue from there.
          </p>
        </div>
        {onClose ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onClose}
            aria-label="Close chat history"
            title="Close chat history"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <ul className="flex-1 space-y-2 overflow-y-auto p-4">
        {isLoading && safeHistory.length === 0 ? (
          <div className="space-y-4">
            <SkeletonText lines={2} className="rounded-xl border border-border/20 p-4" />
            <SkeletonText lines={2} className="rounded-xl border border-border/20 p-4" />
            <SkeletonText lines={2} className="rounded-xl border border-border/20 p-4" />
          </div>
        ) : null}

        {!isLoading && safeHistory.length === 0 ? (
          <li className="rounded-2xl border border-border/30 bg-muted/10 p-4 text-center text-xs text-muted-foreground">
            No saved conversations yet.
          </li>
        ) : null}

        {safeHistory.map((session) => {
          const isActive = session.id === activeSessionId;
          const sessionMessages = Array.isArray(session?.messages) ? session.messages : [];
          const preview =
            sessionMessages.find((message) => message?.role === 'user' && message?.content)?.content
            || sessionMessages.find((message) => message?.role === 'assistant' && !message?.isWelcome)?.content
            || '';
          const previewSingleLine = String(preview || '').split('\n')[0].trim();
          const createdAtLabel = session?.createdAt ? new Date(session.createdAt).toLocaleString() : 'Unknown time';

          return (
            <li
              key={session?.id || Math.random().toString(36).slice(2, 11)}
              className={`rounded-2xl border shadow-sm transition-shadow hover:shadow-md ${
                isActive
                  ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/20'
                  : 'border-border/30 bg-background/80'
              }`}
            >
              <div className="flex items-stretch">
                <button
                  type="button"
                  onClick={() => session?.id && onRestore(session.id)}
                  className="min-w-0 flex-1 rounded-l-2xl px-3 py-3 text-left transition-colors hover:bg-emerald-50/70 dark:hover:bg-emerald-950/20"
                >
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold text-foreground">{session?.title || 'New Chat'}</div>
                    {isActive ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        Active
                      </span>
                    ) : null}
                  </div>

                  {session?.folderName ? (
                    <div className="mt-1 inline-flex items-center rounded-full border border-border/50 bg-background/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      {session.folderName}
                    </div>
                  ) : null}

                  {previewSingleLine ? (
                    <div className="mt-2 line-clamp-1 text-xs leading-relaxed text-muted-foreground overflow-hidden text-ellipsis">
                      {previewSingleLine}
                    </div>
                  ) : null}

                          <div className="mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>{createdAtLabel}</span>
                    </div>
                    <div className="mt-1 text-xs text-foreground/80">{sessionMessages.length} messages</div>
                  </div>
                </button>

                <div className="flex flex-col justify-center gap-1 border-l border-border/40 px-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => session?.id && onDelete(session.id)}
                    className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Delete conversation"
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
});

