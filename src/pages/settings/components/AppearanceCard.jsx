import React from 'react';
import { Moon, Palette, Sun } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { cn } from '../../../utils/cn';
import { Card, CardContent } from '../../../components/ui/Card';

const themes = [
  {
    value: 'system',
    label: 'Auto',
    icon: Palette,
    description: 'Match the device theme automatically.',
    preview: 'bg-[linear-gradient(135deg,#fafbfb_0%,#95c9ac_52%,#173426_100%)]',
  },
  {
    value: 'light',
    label: 'Clean Laboratory',
    icon: Sun,
    description: 'Optimized for high-visibility analysis.',
    preview: 'bg-[linear-gradient(135deg,#fafbfb_0%,#eef6f1_48%,#95c9ac_100%)]',
  },
  {
    value: 'dark',
    label: 'Deep Analysis',
    icon: Moon,
    description: 'Reduced eye strain for long sessions.',
    preview: 'bg-[linear-gradient(135deg,#102319_0%,#173426_52%,#2d5640_100%)]',
  },
];

export function AppearanceCard() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <Card variant="branded" className="border-border/60 bg-card/82 shadow-lg backdrop-blur-xl h-full">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Palette className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary/80">Visual Identity</p>
            <h2 className="text-lg font-bold">Atmosphere</h2>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <p className="text-xs text-muted-foreground">
            Current applied mode: <span className="font-semibold text-foreground capitalize">{resolvedTheme}</span>
          </p>
          <div className="grid flex-1 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Color theme">
          {themes.map(({ value, label, icon: Icon, description, preview }) => {
            const active = theme === value;

            return (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                role="radio"
                aria-checked={active}
                className={cn(
                  'group relative overflow-hidden rounded-[26px] border p-4 text-left transition-all duration-300',
                  active
                    ? 'border-primary/40 bg-primary/5 shadow-xl shadow-primary/10 ring-1 ring-primary/20'
                    : 'border-border/40 bg-background/50 hover:border-primary/20 hover:bg-background/80'
                )}
              >
                <div className={`h-24 rounded-2xl transition-transform duration-500 group-hover:scale-[1.02] ${preview}`} />
                <div className="mt-4 flex items-center gap-3">
                  <div className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors',
                    active ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-muted text-muted-foreground'
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{label}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{description}</p>
                  </div>
                </div>
                {active && (
                  <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary shadow-lg shadow-primary/50 animate-pulse" />
                )}
              </button>
            );
          })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
