import React from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Send, Loader2 } from 'lucide-react';

export function ChatInput({ input, setInput, onSubmit, loading, inputRef }) {
  return (
    <div className="p-4 border-t border-border/30 bg-card/50 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="flex gap-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about your knowledge graph..."
          className="flex-1 h-11 bg-muted/20 transition-shadow duration-300 focus:shadow-md focus:shadow-primary/5"
          disabled={loading}
        />
        <Button
          type="submit"
          variant="gradient"
          size="icon"
          className="h-11 w-11 shrink-0"
          disabled={loading || !input.trim()}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
