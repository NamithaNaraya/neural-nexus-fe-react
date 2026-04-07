import React from 'react';
import { ProfileCard } from './components/ProfileCard';
import { AppearanceCard } from './components/AppearanceCard';
import { FolderPermissionsCard } from './components/FolderPermissionsCard';
import { PasswordCard } from './components/PasswordCard';

export default function SettingsPage() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <div className="rounded-[26px] border border-border/40 bg-gradient-to-r from-emerald-500/[0.06] via-background/95 to-amber-500/[0.05] px-5 py-4 shadow-[0_18px_46px_-36px_rgba(15,23,42,0.24)]">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Workspace settings</p>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="gradient-text">Settings</span>
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Profile, sharing, password, and appearance in one compact workspace.
          </p>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden xl:grid-cols-[1.02fr_0.98fr]">
        <div className="flex min-h-0 flex-col gap-4">
          <ProfileCard />
          <FolderPermissionsCard />
        </div>
        <div className="flex min-h-0 flex-col gap-4">
          <PasswordCard />
          <AppearanceCard />
        </div>
      </div>
    </div>
  );
}
