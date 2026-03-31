import React from 'react';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { FileText, Network, GitFork, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export function FolderFilesPanel({
  active,
  folderContentSearch,
  setFolderContentSearch,
  filesLoading,
  filteredFolderFiles,
}) {
  return (
    <section
      aria-hidden={!active}
      className={cn(
        'absolute inset-0 rounded-2xl border border-border/30 bg-background/70 p-4 transition-opacity duration-200 ease-out motion-reduce:transition-none',
        active
          ? 'z-10 opacity-100'
          : 'z-0 pointer-events-none opacity-0'
      )}
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-sm font-semibold">Files</h3>
          <p className="text-xs text-muted-foreground">Search files in this folder.</p>
        </div>
        <Input
          value={folderContentSearch}
          onChange={(e) => setFolderContentSearch(e.target.value)}
          placeholder="Search files..."
          className="h-10 w-full lg:max-w-sm"
        />
        </div>

        <div className="relative flex-1 min-h-0 space-y-2 overflow-y-auto pr-1">
          {filesLoading && filteredFolderFiles.length > 0 && (
            <div className="sticky top-0 z-10 flex items-center justify-end pb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/90 px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                Updating
              </span>
            </div>
          )}

          {filesLoading && filteredFolderFiles.length === 0 ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : filteredFolderFiles.length > 0 ? (
            filteredFolderFiles.map((file) => (
              <div key={file.id} className="flex items-center gap-3 rounded-xl border border-border/20 bg-muted/10 p-3 transition-colors hover:bg-muted/20">
                <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.filename}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant={file.status === 'completed' ? 'success' : file.status === 'processing' ? 'info' : 'secondary'} className="text-[10px]">
                      {file.status}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Network className="w-2.5 h-2.5" /> {file.node_count} nodes
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <GitFork className="w-2.5 h-2.5" /> {file.relationship_count} rels
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="shrink-0 text-[10px] uppercase">
                  {file.file_type}
                </Badge>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-border/20 bg-muted/10 p-4 text-center text-sm text-muted-foreground">
              {folderContentSearch.trim() ? 'No matching files found.' : 'No files in this folder.'}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
