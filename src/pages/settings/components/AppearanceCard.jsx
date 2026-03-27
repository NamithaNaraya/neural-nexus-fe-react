import React from 'react';
import { Moon, Palette, Sun } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { cn } from '../../../utils/cn';

const themes = [
  {
    value: 'light',
    label: 'Light',
    icon: Sun,
    description: 'Clean bright workspace with soft blue surfaces.',
    preview: 'from-slate-100 via-white to-sky-50',
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: Moon,
    description: 'Calm dark canvas for longer analysis sessions.',
    preview: 'from-slate-950 via-slate-900 to-slate-800',
  },
];

export function AppearanceCard() {
  const { theme, setTheme } = useTheme();

  return (
    <section className="rounded-[30px] border border-border/60 bg-card/82 p-6 shadow-[0_22px_60px_-36px_rgba(15,23,42,0.34)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Palette className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Appearance</p>
          <h2 className="text-2xl font-semibold">Choose the interface mood</h2>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {themes.map(({ value, label, icon: Icon, description, preview }) => {
          const active = theme === value;

          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={cn(
                'rounded-[28px] border p-5 text-left transition',
                active
                  ? 'border-primary/40 bg-primary/[0.08] shadow-[0_16px_40px_-28px_rgba(59,130,246,0.42)]'
                  : 'border-border/60 bg-background/70 hover:border-primary/20 hover:bg-background'
              )}
            >
              <div className={`h-28 rounded-[22px] bg-gradient-to-br ${preview}`} />
              <div className="mt-4 flex items-center gap-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-2xl', active ? 'bg-primary/12 text-primary' : 'bg-muted text-muted-foreground')}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-base font-semibold">{label}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
