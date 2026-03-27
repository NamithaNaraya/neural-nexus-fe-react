import React from 'react';
import { Button } from '../../components/ui/Button';
import { Download, FileText, History, Scroll, Trash2 } from 'lucide-react';

export function ChatToolbar({
  onClear,
  onExportText,
  onExportJson,
  onToggleHistory,
  isHistoryOpen,
  onScrollBottom,
  loading,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border/40 bg-background/70 p-2">
      <Button size="sm" variant="secondary" onClick={onScrollBottom} className="gap-1">
        <Scroll className="w-4 h-4" /> Scroll to bottom
      </Button>

      <Button size="sm" variant="secondary" onClick={onToggleHistory} className="gap-1">
        <History className="w-4 h-4" /> {isHistoryOpen ? 'Hide History' : 'Show History'}
      </Button>

      <Button size="sm" onClick={onExportText} className="gap-1 bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:opacity-90">
        <FileText className="w-4 h-4" /> Export TXT
      </Button>

      <Button size="sm" onClick={onExportJson} className="gap-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90">
        <Download className="w-4 h-4" /> Export JSON
      </Button>

      <Button size="sm" variant="destructive" onClick={onClear} disabled={loading} className="gap-1">
        <Trash2 className="w-4 h-4" /> Clear Chat
      </Button>
    </div>
  );
}
