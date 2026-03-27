import React from 'react';
import { Button } from '../../components/ui/Button';
import { ClipboardCopy, Trash2 } from 'lucide-react';

export function ChatHistoryPanel({ history, onRestore, onDelete }) {
  return (
    <div className="h-full overflow-y-auto border-l border-border/40 bg-background/40 p-3">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">History</h2>
      <ul className="space-y-2">
        {history.length === 0 && (
          <li className="rounded-xl border border-border/30 bg-muted/10 p-2 text-xs text-muted-foreground">No saved sessions yet.</li>
        )}
        {history.map((session) => (
          <li key={session.id} className="rounded-xl border border-border/30 bg-white p-2 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold">{session.label}</div>
                <div className="text-xs text-muted-foreground">{new Date(session.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex gap-1">
                <Button size="xs" variant="outline" onClick={() => onRestore(session.id)} className="gap-1">
                  <ClipboardCopy className="w-3 h-3" /> Restore
                </Button>
                <Button size="xs" variant="ghost" onClick={() => onDelete(session.id)}>
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
