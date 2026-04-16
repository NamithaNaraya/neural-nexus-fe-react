import React from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Send, Loader2, Globe } from 'lucide-react';
import { cn } from '../../utils/cn';

export function ChatInput({ 
  input, 
  setInput, 
  onSubmit, 
  onWebSearch, 
  loading, 
  inputRef,
  isWebSearchEnabled,
  setIsWebSearchEnabled
}) {
  return (
    <div className="border-t border-border/30 bg-card/50 px-4 py-3 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="flex gap-2">
        <label htmlFor="chat-message-input" className="sr-only">
          Ask a question about the selected folder or knowledge graph
        </label>
        <Input
          id="chat-message-input"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isWebSearchEnabled ? "Search web + knowledge graph..." : "Ask anything about your knowledge graph..."}
          className="flex-1 h-11 bg-muted/20 transition-all duration-300 focus:shadow-lg focus:shadow-primary/10 focus:ring-2 focus:ring-primary/20 rounded-xl"
          disabled={loading}
          aria-describedby="chat-input-help"
          autoComplete="off"
        />
        <Button
          type="button"
          variant={isWebSearchEnabled ? "solid" : "outline"}
          size="icon"
          className={cn(
            "h-11 w-11 shrink-0 transition-all duration-200 rounded-xl",
            isWebSearchEnabled 
              ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/25 border-transparent" 
              : "hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-muted-foreground"
          )}
          onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
          disabled={loading}
          title={isWebSearchEnabled ? "Web Search Enabled" : "Enable Web Search"}
          aria-label={isWebSearchEnabled ? "Disable web search" : "Enable web search"}
        >
          <Globe className={cn("w-4 h-4", isWebSearchEnabled ? "text-white" : "text-emerald-600 dark:text-emerald-300")} />
        </Button>
        <Button
          type="submit"
          variant="gradient"
          size="icon"
          className="h-11 w-11 shrink-0 shadow-lg hover:shadow-xl transition-shadow duration-200 rounded-xl"
          disabled={loading || !input.trim()}
          aria-label={loading ? 'Sending message' : 'Send message'}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
      <p id="chat-input-help" className="sr-only">
        Press Enter to send. Toggle the globe to include web search results.
      </p>
    </div>
  );
}
