import React from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Send, Loader2, Globe } from 'lucide-react';

export function ChatInput({ input, setInput, onSubmit, onWebSearch, loading, inputRef }) {
  return (
    <div className="p-4 border-t border-border/30 bg-card/50 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="flex gap-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about your knowledge graph or search the web..."
          className="flex-1 h-11 bg-muted/20 transition-all duration-300 focus:shadow-lg focus:shadow-primary/10 focus:ring-2 focus:ring-primary/20 rounded-xl"
          disabled={loading}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
          onClick={() => onWebSearch?.(input.trim())}
          disabled={loading || !input.trim()}
          title="Search Web"
        >
          <Globe className="w-4 h-4 text-blue-600" />
        </Button>
        <Button
          type="submit"
          variant="gradient"
          size="icon"
          className="h-11 w-11 shrink-0 shadow-lg hover:shadow-xl transition-shadow duration-200"
          disabled={loading || !input.trim()}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span>Press Enter to send, click globe for web search</span>
        <span className="flex items-center gap-1">
          <Globe className="w-3 h-3" />
          Web Search Available
        </span>
      </div>
    </div>
  );
}
