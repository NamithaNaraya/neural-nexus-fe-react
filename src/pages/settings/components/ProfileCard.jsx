import React from 'react';
import { Shield } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { Card, CardContent } from '../../../components/ui/Card';

export function ProfileCard() {
  const { user } = useAuth();

  return (
    <Card variant="branded" className="border-border/60 bg-card/82 shadow-lg backdrop-blur-xl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4 rounded-3xl border border-border/50 bg-gradient-to-r from-background/90 to-emerald-500/[0.05] px-4 py-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-sage-500 text-lg font-bold text-white shadow-xl shadow-emerald-500/20">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400">Security Identity</p>
              <p className="truncate text-base font-semibold text-foreground">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-emerald-500" />
            {user?.role || 'user'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
