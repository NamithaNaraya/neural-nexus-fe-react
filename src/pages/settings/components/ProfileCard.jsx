import React from 'react';
import { Shield } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { Card, CardContent } from '../../../components/ui/Card';

export function ProfileCard() {
  const { user } = useAuth();

  return (
    <Card variant="branded" className="border-border/60 bg-card/82 shadow-lg backdrop-blur-xl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4 rounded-3xl border border-border/50 bg-gradient-to-r from-background/90 to-primary/[0.06] px-4 py-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-white shadow-xl shadow-primary/20">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Security Identity</p>
              <p className="truncate text-base font-semibold text-foreground">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-primary" />
            {user?.role || 'user'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
