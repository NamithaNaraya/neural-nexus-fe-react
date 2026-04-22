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
    <div className="relative z-10 px-8 pb-10 pt-4">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[32px] border border-border/20 bg-secondary/30 p-2 shadow-[0_32px_64px_-12px_rgba(45,58,40,0.15)] backdrop-blur-3xl ring-1 ring-white/10 transition-all duration-700 hover:shadow-[0_48px_80px_-12px_rgba(45,58,40,0.2)]">
        <form onSubmit={onSubmit} className="flex items-center gap-2.5">
          <label htmlFor="chat-message-input" className="sr-only">
            Ask a botanical research question or query the network
          </label>
          
          <button
            type="button"
            onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
            disabled={loading}
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center transition-all duration-500 rounded-2xl",
              isWebSearchEnabled 
                ? "bg-primary text-white shadow-xl shadow-primary/30" 
                : "text-muted-foreground/60 hover:text-primary hover:bg-primary/10"
            )}
            title={isWebSearchEnabled ? "Digesting Global Knowledge" : "Scan Hybrid Ecosystem"}
            aria-label={isWebSearchEnabled ? "Disable web search" : "Enable web search"}
          >
            <Globe className={cn("w-5.5 h-5.5 transition-transform duration-700", isWebSearchEnabled && "animate-spin-slow")} />
          </button>

          <Input
            id="chat-message-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isWebSearchEnabled ? "Query the global knowledge network..." : "Search the local research graph..."}
            className="flex-1 border-none bg-transparent shadow-none focus:ring-0 h-12 text-[15px] font-bold tracking-tight text-foreground placeholder:text-muted-foreground/40"
            disabled={loading}
            aria-describedby="chat-input-help"
            autoComplete="off"
          />

          <Button
            type="submit"
            variant="default"
            size="icon"
            className="h-12 w-12 shrink-0 rounded-2xl shadow-xl shadow-primary/20 transition-all duration-500 active:scale-95 group/send"
            disabled={loading || !input.trim()}
            aria-label={loading ? 'Synthesizing...' : 'Seed query'}
          >
            {loading ? (
              <Loader2 className="w-5.5 h-5.5 animate-spin" />
            ) : (
              <Send className="w-5.5 h-5.5 transition-transform group-hover/send:translate-x-1 group-hover/send:-translate-y-1" />
            )}
          </Button>
        </form>
      </div>
      <p id="chat-input-help" className="sr-only">
        Enter to submit. Use the globe to toggle cross-ecosystem research.
      </p>
    </div>

  );
}
