import React from 'react';
import { Sidebar } from './Sidebar';
import { useTheme } from '../../contexts/ThemeContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { Moon, Sun, Bell, Search, Command } from 'lucide-react';
import { cn } from '../../utils/cn';

export function DashboardLayout({ children }) {
  const { theme, toggleTheme } = useTheme();
  const { expanded } = useSidebar();

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col relative w-full h-full">
        {/* Top Navbar */}
        <header className="h-14 border-b border-border/30 bg-card/50 backdrop-blur-xl flex items-center justify-between px-6 z-10 shrink-0">
          {/* Left — Search */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 h-9 px-3 rounded-lg bg-muted/30 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all text-sm max-w-xs">
              <Search className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline text-muted-foreground/60">Search anything...</span>
              <kbd className="hidden md:inline-flex h-5 items-center gap-0.5 rounded border border-border/50 bg-muted/30 px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-4">
                <Command className="w-3 h-3" />K
              </kbd>
            </button>
          </div>

          {/* Right — Actions */}
          <div className="flex items-center gap-1">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-card" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-[18px] h-[18px] text-amber-400" />
              ) : (
                <Moon className="w-[18px] h-[18px] text-blue-500" />
              )}
            </button>

            {/* Version badge */}
            <div className="hidden md:flex items-center ml-2 px-2 py-1 rounded-md bg-primary/5 border border-primary/10">
              <span className="text-[10px] font-bold text-primary/70 tracking-wider">v2.0</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto relative">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-background via-background to-primary/[0.02]" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] -z-10 bg-blue-500/[0.02] rounded-full blur-[120px]" />

          <div className="p-6 max-w-[1400px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
