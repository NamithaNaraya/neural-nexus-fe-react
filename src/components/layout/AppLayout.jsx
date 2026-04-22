import React from 'react';
import { Sidebar } from './Sidebar';
import { HeaderFolderPicker } from './HeaderFolderPicker';
import { useTheme } from '../../contexts/ThemeContext';
import { useGlobalFolder } from '../../contexts/GlobalFolderContext';
import { Moon, Sun, Sprout, Leaf, Activity, Terminal, Cpu } from 'lucide-react';
import { cn } from '../../utils/cn';

export function AppLayout({ children }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const {
    folders,
    selectedFolderId,
    setSelectedFolderId,
    loading,
  } = useGlobalFolder();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Sidebar />

      <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-[120] flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-white/30 backdrop-blur-[40px] px-8 transition-all duration-700">
          <div className="flex items-center gap-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-primary shadow-2xl shadow-primary/30 ring-4 ring-primary/10 animate-float">
              <Sprout className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-[900] tracking-tighter text-foreground leading-none">NESSO</span>
              <span className="text-[8px] font-black text-primary/70 tracking-[0.25em] uppercase mt-0.5">Platform</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <HeaderFolderPicker
              folders={folders}
              selectedFolderId={selectedFolderId}
              setSelectedFolderId={setSelectedFolderId}
              loading={loading}
            />

            <div className="mx-2 h-8 w-px bg-border/10" />

            <div className="flex items-center gap-2 bg-secondary/30 p-1 rounded-[16px] border border-border/10 shadow-inner ring-1 ring-white/5">
              <button
                onClick={toggleTheme}
                type="button"
                aria-label={resolvedTheme === 'dark' ? 'Activate Light Mode' : 'Activate Dark Mode'}
                className="group relative flex h-8 w-8 items-center justify-center rounded-[12px] bg-white text-primary shadow-xl shadow-primary/20 transition-all duration-500 hover:scale-110 active:scale-95"
              >
                {resolvedTheme === 'dark' ? (
                  <Sun className="h-4 w-4 transition-transform duration-700 group-hover:rotate-90" />
                ) : (
                  <Moon className="h-4 w-4 transition-transform duration-700 group-hover:-rotate-45" />
                )}
              </button>
            </div>

          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="relative flex-1 flex flex-col overflow-hidden focus:outline-none scroll-smooth bg-transparent">
          {/* Ambient Backgrounds - NEW: CRAZY GLASSY ARCHITECTURE */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            {/* Primary Morphing Blob */}
            <div className="absolute -left-[10%] -top-[10%] h-[70%] w-[70%] rounded-full bg-primary/10 blur-[120px] animate-morph opacity-60" />
            
            {/* Secondary Floating Blob */}
            <div className="absolute right-[5%] top-[10%] h-[60%] w-[60%] rounded-full bg-accent/8 blur-[100px] animate-float-complex" />
            
            {/* Accent Warm Blob */}
            <div className="absolute bottom-[10%] left-[30%] h-[50%] w-[50%] rounded-full bg-accent-warm/6 blur-[140px] animate-pulse-slow" />
            
            {/* High-Frequency Detail Blobs */}
            <div className="absolute top-[40%] left-[20%] h-[20%] w-[20%] rounded-full bg-primary/15 blur-[60px] animate-bounce-slow" />
            
            {/* Subtle Gradient Mesh Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_hsl(var(--background))_80%)] opacity-30" />
          </div>

          {/* Main Content Container with Premium Gutters */}
          <div className="flex flex-1 flex-col h-full min-h-0 w-full px-6 md:px-12 lg:px-16 max-w-[1920px] mx-auto transition-all duration-700 overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
