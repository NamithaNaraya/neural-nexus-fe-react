import React from 'react';
import { cn } from '../../utils/cn';
import { Bot, Network, Globe, ExternalLink, Loader2 } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export function MessageBubble({ message, onWebSearch, messageIndex }) {
  const isUser = message.role === 'user';
  const isError = message.isError;
  const isWebSearch = message.isWebSearch;
  const webSearchPending = message.webSearchPending;
  const webSearchSuggested = message.webSearchSuggested;

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

  const renderMarkdownInline = (text) => {
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const pieces = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        pieces.push(text.slice(lastIndex, match.index));
      }
      pieces.push(
        <a key={match.index} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-emerald-700 dark:text-emerald-300 hover:underline">
          {match[1]}
          <ExternalLink className="w-3 h-3 inline-block ml-1" />
        </a>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      pieces.push(text.slice(lastIndex));
    }

    return pieces.length ? pieces : text;
  };

  const renderMarkdownBlock = (text) => {
    const lines = (text || '').split('\n');
    return lines.map((line, idx) => {
      if (!line.trim()) return <br key={idx} />;

      if (line.startsWith('- [')) {
        const match = line.match(/- \[([^\]]+)\]\(([^)]+)\): (.+)/);
        if (match) {
          const [, title, url, snippet] = match;
          return (
            <div key={idx} className="mb-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded border-l-4 border-emerald-500">
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-emerald-700 dark:text-emerald-300 hover:underline font-medium flex items-center gap-1">
                {title}
                <ExternalLink className="w-3 h-3" />
              </a>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{snippet}</p>
            </div>
          );
        }
      }

      return (
        <p key={idx} className="mb-2 last:mb-0">
          {renderMarkdownInline(line)}
        </p>
      );
    });
  };

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 shadow-sm animate-pulse">
          {isWebSearch ? <Globe className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
        </div>
      )}

      <div className={cn(
        'rounded-2xl px-4 py-3 text-sm leading-relaxed transition-all duration-300 hover:shadow-md',
        isUser ? 'max-w-[85%]' : 'max-w-[90%]',
        isUser
          ? 'bg-primary text-primary-foreground rounded-br-md shadow-sm shadow-emerald-600/20'
          : isError
            ? 'bg-red-50 border border-red-200 text-red-900 rounded-bl-md dark:bg-red-900/20 dark:border-red-800 dark:text-red-100'
            : isWebSearch
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-bl-md dark:bg-emerald-950/25 dark:border-emerald-800 dark:text-emerald-50'
              : 'bg-white/80 border border-gray-200 text-gray-900 rounded-bl-md dark:bg-gray-800/80 dark:border-gray-700 dark:text-gray-100 backdrop-blur-sm'
      )}>
        {table ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {table.headers.map((header, idx) => (
                    <th key={idx} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {table.rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert break-words whitespace-normal w-full">
            {renderMarkdownBlock(message.content)}
          </div>
        )}

        {!isUser && !isError && onWebSearch && !message.webSearchAnswer && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => onWebSearch({
                question: message.webSearchQuery || message.content,
                contextHint: message.content,
                messageIndex,
              })}
              disabled={webSearchPending}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-60',
                webSearchSuggested
                  ? 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/25 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              )}
            >
              {webSearchPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              {webSearchPending ? 'Searching the Web...' : 'Search Web for More Info'}
            </button>
          </div>
        )}

        {message.webSearchAnswer && (
          <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20 p-3 rounded-lg">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <Globe className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Web Insights</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest rounded-full bg-emerald-100/80 dark:bg-emerald-900/30 px-2 py-0.5 text-emerald-700 dark:text-emerald-300">
                Grounded
              </span>
            </div>
            <div className="prose prose-sm max-w-none dark:prose-invert break-words whitespace-normal w-full text-stone-700 dark:text-stone-200">
              {renderMarkdownBlock(message.webSearchAnswer)}
            </div>
            {message.webSearchSources && message.webSearchSources.length > 0 && (
              <div className="pt-3 mt-3 border-t border-emerald-200/70 dark:border-emerald-800/60">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Sources
                </p>
                <div className="flex flex-wrap gap-2">
                  {message.webSearchSources.slice(0, 5).map((source, idx) => (
                    <a
                      key={idx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-700 text-[11px] text-emerald-700 dark:text-emerald-300 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors shadow-sm"
                    >
                      <span className="truncate max-w-[180px] font-medium">
                        {source.title || source.url}
                      </span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Network className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Sources:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {message.sources.slice(0, 5).map((source, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {source.node_type || source.type || 'Node'}
                </Badge>
              ))}
              {message.sources.length > 5 && (
                <Badge variant="outline" className="text-xs">+{message.sources.length - 5} more</Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white/80 border border-gray-200 rounded-2xl px-4 py-3 dark:bg-gray-800/80 dark:border-gray-700 backdrop-blur-sm">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}
