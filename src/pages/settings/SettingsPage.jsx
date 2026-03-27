import React from 'react';
import { ProfileCard } from './components/ProfileCard';
import { AppearanceCard } from './components/AppearanceCard';
import { FolderPermissionsCard } from './components/FolderPermissionsCard';
import { PasswordCard } from './components/PasswordCard';

export default function SettingsPage() {
  return (
    <div className="space-y-8 pb-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="gradient-text">Settings</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Account overview, folder permissions, password update, and appearance.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <ProfileCard />
          <FolderPermissionsCard />
        </div>
        <div className="space-y-6">
          <PasswordCard />
          <AppearanceCard />
        </div>
      </div>
    </div>
  );
}
