import React from 'react';
import { Button } from '../../components/ui/Button';
import { ClipboardCopy, Trash2, Clock, MessageSquare } from 'lucide-react';

export function ChatHistoryPanel({ chatHistory, onRestore, onDelete, onExportText, onExportJson }) {
  return (
    <div className="h-full overflow-y-auto border-l border-border/40 bg-gradient-to-b from-background/40 to-muted/20 p-3 backdrop-blur-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Chat History
      </h2>

      <div className="space-y-2 mb-4">
        <Button size="sm" variant="outline" onClick={onExportText} className="w-full gap-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
          <MessageSquare className="w-4 h-4" /> Export All as Text
        </Button>
        <Button size="sm" variant="outline" onClick={onExportJson} className="w-full gap-1 hover:bg-green-50 dark:hover:bg-green-900/20">
          <ClipboardCopy className="w-4 h-4" /> Export All as JSON
        </Button>
      </div>

      <ul className="space-y-2">
        {chatHistory.length === 0 && (
          <li className="rounded-xl border border-border/30 bg-muted/10 p-3 text-xs text-muted-foreground text-center">
            No saved sessions yet. Start chatting to create history!
          </li>
        )}
        {chatHistory.map((session) => (
          <li key={session.id} className="rounded-xl border border-border/30 bg-white/80 p-3 shadow-sm hover:shadow-md transition-shadow backdrop-blur-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{session.label}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {new Date(session.createdAt).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{session.messages.length} messages</div>
              </div>
              <div className="flex flex-col gap-1">
                <Button size="xs" variant="outline" onClick={() => onRestore(session.id)} className="gap-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
                  <ClipboardCopy className="w-3 h-3" /> Restore
                </Button>
                <Button size="xs" variant="ghost" onClick={() => onDelete(session.id)} className="hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
