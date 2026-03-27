import React from 'react';
import { Shield, UserRound } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

export function ProfileCard() {
  const { user } = useAuth();

  return (
    <section className="rounded-[30px] border border-border/60 bg-card/82 p-6 shadow-[0_22px_60px_-36px_rgba(15,23,42,0.34)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <UserRound className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600/80 dark:text-emerald-400/80">Profile</p>
          <h2 className="text-2xl font-semibold">Account overview</h2>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4 rounded-[28px] border border-border/50 bg-background/72 p-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-gradient-to-br from-emerald-400 to-cyan-500 text-2xl font-bold text-white shadow-[0_18px_32px_-18px_rgba(16,185,129,0.5)]">
          {user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <p className="text-lg font-semibold">{user?.email || 'user@example.com'}</p>
          <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            {user?.role || 'user'}
          </div>
        </div>
      </div>
    </section>
  );
}
