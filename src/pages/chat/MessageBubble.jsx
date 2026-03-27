import React, { useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { Bot, User, Network } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const isError = message.isError;

  const parseMarkdownTable = (text) => {
    const lines = text.split('\n');
    if (lines.length < 2) return null;

    const headerLineIndex = lines.findIndex((line) => /\|.+\|/.test(line));
    if (headerLineIndex === -1 || headerLineIndex + 1 >= lines.length) return null;

    const headerParts = lines[headerLineIndex].split('|').map((s) => s.trim()).filter(Boolean);
    const separatorParts = lines[headerLineIndex + 1].split('|').map((s) => s.trim()).filter(Boolean);
    if (separatorParts.length < headerParts.length) return null;

    const dataLines = lines.slice(headerLineIndex + 2).filter((line) => /\|.+\|/.test(line));
    if (dataLines.length === 0) return null;

    const rows = dataLines.map((line) => line.split('|').map((s) => s.trim()).filter(Boolean));

    return { headers: headerParts, rows };
  };

  const table = parseMarkdownTable(message.content);

  return (
    <div className={cn(
      'flex gap-3',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={cn(
        'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed transition-all duration-300',
        isUser
          ? 'bg-primary text-primary-foreground rounded-br-md shadow-sm shadow-primary/10'
          : isError
            ? 'bg-destructive/10 border border-destructive/20 text-foreground rounded-bl-md'
            : 'bg-muted/40 border border-border/30 text-foreground rounded-bl-md'
      )}>
        {table ? (
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse text-left text-xs">
              <thead>
                <tr>
                  {table.headers.map((heading, index) => (
                    <th key={index} className="border border-border/20 bg-muted/30 px-2 py-1 font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white/80' : 'bg-muted/10'}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="border border-border/20 px-2 py-1">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}

        {message.sources?.length > 0 && (
          <div className="mt-3 pt-2 border-t border-border/20 flex flex-wrap gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Sources:</span>
            {message.sources.slice(0, 5).map((src, j) => (
              <Badge key={j} variant="secondary" className="text-[10px]">
                <Network className="w-2.5 h-2.5 mr-1" />
                {src.name || src.id || `Node ${j + 1}`}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shrink-0 shadow-sm">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-muted/40 border border-border/30 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
