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
          <div />

          {/* Right — Actions */}
          <div className="flex items-center gap-1">

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
