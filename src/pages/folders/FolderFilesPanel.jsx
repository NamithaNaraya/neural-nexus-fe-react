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
        'absolute inset-0 rounded-2xl border border-border/20 bg-background/40 p-4 transition-opacity duration-200 ease-out backdrop-blur-3xl',
        active
          ? 'z-10 opacity-100'
          : 'z-0 pointer-events-none opacity-0'
      )}
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-[13px] font-black uppercase tracking-wider text-foreground/80">Source Files</h3>
          <p className="text-[11px] text-muted-foreground font-medium">Search knowledge sources in this folder.</p>
        </div>
        <Input
          value={folderContentSearch}
          onChange={(e) => setFolderContentSearch(e.target.value)}
          placeholder="Search files..."
          className="h-10 w-full lg:max-w-xs rounded-xl border-border/40 focus:ring-primary/20"
        />
        </div>

        <div className="relative flex-1 min-h-0 space-y-2 overflow-y-auto pr-1">
          {filesLoading && filteredFolderFiles.length > 0 && (
            <div className="sticky top-0 z-10 flex items-center justify-end pb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px] font-bold text-primary shadow-sm backdrop-blur-md">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Updating
              </span>
            </div>
          )}

          {filesLoading && filteredFolderFiles.length === 0 ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}
            </div>
          ) : filteredFolderFiles.length > 0 ? (
            filteredFolderFiles.map((file) => (
              <div key={file.id} className="flex items-center gap-4 rounded-2xl border border-border/10 bg-muted/5 p-3 transition-all hover:bg-muted/10 group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-foreground/90 group-hover:text-primary transition-colors">{file.filename}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <Badge variant={file.status === 'completed' ? 'success' : file.status === 'processing' ? 'info' : 'secondary'} className="text-[9px] font-black uppercase tracking-tighter rounded-md h-4 px-1.5 border-none">
                      {file.status}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1.5">
                      <Network className="w-3 h-3 text-primary/60" /> {file.node_count || 0}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1.5">
                      <GitFork className="w-3 h-3 text-primary/60" /> {file.relationship_count || 0}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg border-primary/20 text-primary/80">
                  {file.file_type}
                </Badge>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-border/20 bg-muted/5 p-6 text-center text-sm text-muted-foreground italic">
              {folderContentSearch.trim() ? 'No matching files found.' : 'No files in this folder.'}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
