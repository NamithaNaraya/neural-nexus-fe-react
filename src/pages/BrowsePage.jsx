import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { Search, Network, GitFork, Loader2 } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { graphService } from '../services/graphService';
import { cn } from '../utils/cn';

export default function BrowsePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);

  const doSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const data = await graphService.search(searchQuery, 30);
      setResults(Array.isArray(data) ? data : data.nodes || []);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (value) => {
    setQuery(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => doSearch(value), 400);
    setDebounceTimer(timer);
  };

  // Color map for node types
  const typeColors = {
    Herb: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    PlantPart: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    Phytochemical: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    TherapeuticUse: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    default: 'bg-muted text-muted-foreground border-border/30',
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="gradient-text">Browse Graph</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          Search and explore individual entities in your knowledge graph.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />}
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search nodes by name, type, or property..."
          className="pl-9 h-11"
          autoFocus
        />
      </div>

      {/* Results */}
      {loading && !results && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      )}

      {results !== null && (
        results.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{results.length} result(s) found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {results.map((node, i) => {
                const colorClass = typeColors[node.type] || typeColors.default;
                return (
                  <Card
                    key={node.id || i}
                    className="hover:border-primary/20 hover:shadow-md transition-all duration-300 cursor-pointer group"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border group-hover:scale-110 transition-transform duration-300',
                          colorClass
                        )}>
                          <Network className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm truncate">{node.name || node.id}</h3>
                          <Badge variant="secondary" className="text-[10px] mt-1">{node.type || 'Entity'}</Badge>
                          {node.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{node.description}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <Card className="min-h-[300px] flex items-center justify-center">
            <CardContent className="text-center space-y-3 py-12">
              <Search className="w-10 h-10 mx-auto text-muted-foreground/30" />
              <div>
                <h2 className="text-lg font-semibold">No results found</h2>
                <p className="text-sm text-muted-foreground mt-1">Try a different search term.</p>
              </div>
            </CardContent>
          </Card>
        )
      )}

      {/* Empty initial state */}
      {results === null && !loading && (
        <Card className="min-h-[400px] flex items-center justify-center">
          <CardContent className="text-center space-y-4 py-12">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Search className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Search your graph</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Start typing to search entities across your knowledge graph.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
