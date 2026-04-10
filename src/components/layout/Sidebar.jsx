import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useSidebar } from '../../contexts/SidebarContext';
import { useAuth } from '../../contexts/AuthContext';
import { preloadPageForPath } from '../../pages/pageLoaders';
import {
  Network,
  MessageSquare,
  Upload,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Folder,
  Search,
  Sparkles,
  HelpCircle,
  Palette,
} from 'lucide-react';
import nessoLogo from '../../assets/logo.png';

const navSections = [
  {
    label: 'Main',
    items: [
      { icon: Folder, label: 'Folders', path: '/folders' },
      { icon: Network, label: 'Knowledge Graph', path: '/graph' },
      { icon: Palette, label: 'Visualize Data', path: '/visualize' },
      { icon: MessageSquare, label: 'Chat', path: '/chat', badge: 'RAG+Web' },
    ],
  },
  {
    label: 'Data',
    items: [
      { icon: Upload, label: 'Upload', path: '/upload' },
      { icon: Search, label: 'Browse Graph', path: '/browse' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { icon: Sparkles, label: 'ML Prediction', path: '/ml-prediction' },
      { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    ],
  },
  {
    label: 'System',
    items: [
      { icon: Settings, label: 'Settings', path: '/settings' },
      { icon: HelpCircle, label: 'Help', path: '/help' },
    ],
  },
];

export function Sidebar() {
  const { expanded, toggle } = useSidebar();
  const { user, logout } = useAuth();
  const location = useLocation();
  const handleWarmRoute = (path) => {
    void preloadPageForPath(path);
  };

  return (
    <aside
      className={cn(
        'h-screen flex flex-col border-r border-border/40 transition-all duration-300 ease-in-out relative z-30',
        'bg-gradient-to-b from-card/95 via-card/90 to-card/80 backdrop-blur-2xl',
        expanded ? 'w-64' : 'w-[72px]'
      )}
    >
      {/* Logo Area */}
      <div className="h-16 flex items-center border-b border-border/30 px-4 shrink-0">
        <div className={cn(
          'flex items-center gap-3 overflow-hidden transition-all duration-300',
          expanded ? 'w-full' : 'w-10 justify-center'
        )}>
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-primary/20 bg-white shadow-lg shadow-primary/15 shrink-0 dark:bg-slate-950">
            <img src={nessoLogo} alt="NESSO" className="h-full w-full object-contain p-1" />
          </div>
          <div className={cn(
            'transition-all duration-200 overflow-hidden whitespace-nowrap',
            expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
          )}>
            <h1 className="font-extrabold text-base leading-tight text-primary dark:text-primary">NESSO Botanica</h1>
            <p className="text-[10px] font-medium tracking-widest uppercase text-primary/60 dark:text-primary/60">
              Natural &amp; Essential Oils
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav aria-label="Primary" className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-6 scrollbar-thin">
        {navSections.map((section) => (
          <div key={section.label} className="space-y-1">
            {/* Section label */}
            <div className={cn(
              'px-3 mb-2 transition-all duration-200',
              expanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden mb-0'
            )}>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40">
                {section.label}
              </span>
            </div>

            {section.items.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  aria-label={item.label}
                  onMouseEnter={() => handleWarmRoute(item.path)}
                  onFocus={() => handleWarmRoute(item.path)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group',
                    isActive
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                    !expanded && 'justify-center px-0'
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-primary shadow-sm shadow-primary/50" />
                  )}

                  <item.icon className={cn(
                    'w-5 h-5 shrink-0 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  )} />

                  <span className={cn(
                    'transition-all duration-200 whitespace-nowrap',
                    expanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                  )}>
                    {item.label}
                  </span>

                  {/* Badge */}
                  {item.badge && expanded && (
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/15 text-primary">
                      {item.badge}
                    </span>
                  )}

                  {/* Tooltip when collapsed */}
                  {!expanded && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-popover border border-border shadow-xl text-sm font-medium text-popover-foreground opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                      {item.label}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 rotate-45 bg-popover border-l border-b border-border" />
                    </div>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-border/30 p-3 shrink-0">
        <div className={cn(
          'flex items-center gap-3 p-2 rounded-xl hover:bg-accent/30 transition-all duration-200 cursor-pointer',
          !expanded && 'justify-center p-2'
        )}>
          {/* Avatar */}
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white shadow-sm shrink-0">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>

          <div className={cn(
            'flex-1 min-w-0 transition-all duration-200',
            expanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
          )}>
            <p className="text-sm font-medium truncate">{user?.email || 'User'}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{user?.role || 'user'}</p>
          </div>

          {expanded && (
            <button
              onClick={logout}
              type="button"
              aria-label="Sign out"
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-red-400 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Collapse/Expand Toggle */}
      <button
        onClick={toggle}
        type="button"
        aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        className={cn(
          'absolute -right-3 top-20 w-6 h-6 rounded-full border border-border/60 bg-card flex items-center justify-center',
          'text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200',
          'shadow-md hover:shadow-lg z-40'
        )}
      >
        {expanded ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>
    </aside>
  );
}
