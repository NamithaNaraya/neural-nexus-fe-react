import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Moon,
  Sun,
  Monitor,
  Palette,
  User,
  Shield,
  Bell,
  Globe,
} from 'lucide-react';
import { cn } from '../utils/cn';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const themes = [
    { value: 'dark', label: 'Dark Mode', icon: Moon, desc: 'Easier on the eyes' },
    { value: 'light', label: 'Light Mode', icon: Sun, desc: 'Classic bright theme' },
  ];

  return (
    <div className="space-y-6 animate-fade-up max-w-3xl">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="gradient-text">Settings</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          Customize your Neural Nexus experience.
        </p>
      </div>

      {/* Profile */}
      <Card className="hover:border-primary/10 transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-4 h-4 text-primary" />
            Profile
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-emerald-500/20">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-semibold">{user?.email || 'user@example.com'}</p>
              <p className="text-sm text-muted-foreground capitalize flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                {user?.role || 'user'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card className="hover:border-primary/10 transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="w-4 h-4 text-primary" />
            Appearance
          </CardTitle>
          <CardDescription>Choose your preferred color scheme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {themes.map(t => (
              <button
                key={t.value}
                onClick={() => { if (theme !== t.value) toggleTheme(); }}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200',
                  theme === t.value
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border/40 hover:border-primary/30 hover:bg-muted/20'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  theme === t.value ? 'bg-primary/10' : 'bg-muted/30'
                )}>
                  <t.icon className={cn('w-5 h-5', theme === t.value ? 'text-primary' : 'text-muted-foreground')} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Backend Connection */}
      <Card className="hover:border-primary/10 transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="w-4 h-4 text-primary" />
            Backend Connection
          </CardTitle>
          <CardDescription>API server configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="text-sm">
              <span className="text-muted-foreground">Connected to </span>
              <code className="text-xs bg-muted/30 px-1.5 py-0.5 rounded font-mono">localhost:8000</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
