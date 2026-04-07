import React from 'react';
import { Shield, UserRound } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

export function ProfileCard() {
  const { user } = useAuth();

  return (
    <section className="rounded-[24px] border border-border/60 bg-card/82 p-4 shadow-[0_18px_46px_-36px_rgba(15,23,42,0.3)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 rounded-[20px] border border-border/50 bg-gradient-to-r from-background/90 to-emerald-500/[0.05] px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-base font-bold text-white shadow-[0_18px_32px_-18px_rgba(16,185,129,0.5)]">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-600/80 dark:text-emerald-400/80">Profile</p>
            <p className="truncate text-sm font-semibold">{user?.email || 'user@example.com'}</p>
          </div>
        </div>
        <div className="inline-flex shrink-0 items-center gap-2 rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
          <Shield className="h-3.5 w-3.5" />
          {user?.role || 'user'}
        </div>
      </div>
    </section>
  );
}
