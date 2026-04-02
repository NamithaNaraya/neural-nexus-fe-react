import React from 'react';
import { Sidebar } from './Sidebar';
import { HeaderFolderPicker } from './HeaderFolderPicker';
import { useTheme } from '../../contexts/ThemeContext';
import { useGlobalFolder } from '../../contexts/GlobalFolderContext';
import { Moon, Sun } from 'lucide-react';

export function AppLayout({ children }) {
  const { theme, toggleTheme } = useTheme();
  const {
    folders,
    selectedFolderId,
    setSelectedFolderId,
    loading,
  } = useGlobalFolder();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar />

      <div className="relative flex h-full w-full flex-1 flex-col">
        <header className="relative z-[120] flex h-16 shrink-0 items-center justify-between overflow-visible border-b border-border/30 bg-card/50 px-6 backdrop-blur-xl">
          <div />

          <div className="flex items-center gap-1">
            <HeaderFolderPicker
              folders={folders}
              selectedFolderId={selectedFolderId}
              setSelectedFolderId={setSelectedFolderId}
              loading={loading}
            />

            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              {theme === 'dark' ? (
                <Sun className="h-[18px] w-[18px] text-amber-600" />
              ) : (
                <Moon className="h-[18px] w-[18px] text-emerald-600" />
              )}
            </button>

            <div className="ml-2 hidden items-center rounded-md border border-primary/10 bg-primary/5 px-2 py-1 md:flex">
              <span className="text-[10px] font-bold tracking-wider text-primary/70">v2.0</span>
            </div>
          </div>
        </header>

        <main className="relative flex-1 overflow-auto">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-background via-background to-primary/[0.02]" />
          <div className="absolute right-0 top-0 -z-10 h-[600px] w-[600px] rounded-full bg-emerald-500/[0.04] blur-[120px]" />

          <div className="flex h-full w-full flex-col px-6 py-5">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
