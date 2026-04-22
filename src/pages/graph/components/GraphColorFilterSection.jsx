import React from 'react';
import { cn } from '../../../utils/cn';
import { withAlpha } from '../colorSystem';

export function GraphColorFilterSection({
  title,
  icon: Icon,
  items,
  activeItems,
  setActiveItems,
  colorMap,
  setColorMap,
  getColor,
}) {
  const toHex = (value) => {
    const v = String(value || '').trim();
    if (/^#[0-9a-f]{6}$/i.test(v)) return v;
    const hslMatch = v.match(/hsl\(\s*([0-9.]+)\s+([0-9.]+)%\s+([0-9.]+)%\s*\)/i);
    if (!hslMatch) return '#6b7280';
    const h = Number(hslMatch[1]);
    const s = Number(hslMatch[2]) / 100;
    const l = Number(hslMatch[3]) / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hp = (h % 360) / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    let r = 0; let g = 0; let b = 0;
    if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0];
    else if (hp < 2) [r, g, b] = [x, c, 0];
    else if (hp < 3) [r, g, b] = [0, c, x];
    else if (hp < 4) [r, g, b] = [0, x, c];
    else if (hp < 5) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    const m = l - c / 2;
    const to255 = (n) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
    return `#${to255(r)}${to255(g)}${to255(b)}`;
  };

  const hasNone = activeItems.has('__none__');
  const allSelected = items.length > 0 && !hasNone && (activeItems.size === 0 || activeItems.size === items.length);
  const activeCount = hasNone ? 0 : (activeItems.size === 0 ? items.length : activeItems.size);

  const toggleItem = (value) => {
    setActiveItems((current) => {
      const next = current.size === 0 ? new Set(items) : new Set(current);
      next.delete('__none__');

      if (next.has(value)) next.delete(value);
      else next.add(value);

      if (next.size === items.length) {
        return new Set();
      }
      if (next.size === 0) {
        return new Set(['__none__']);
      }
      return next;
    });
  };

  const selectAll = () => {
    setActiveItems(new Set());
  };

  const clearAll = () => {
    setActiveItems(new Set(['__none__']));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          <span className="whitespace-nowrap">{title}</span>
        </div>
        <div className="inline-flex shrink-0 items-center overflow-hidden rounded-full border border-border/30 bg-background/35 text-[10px] font-medium">
          <button
            type="button"
            onClick={selectAll}
            className="px-3 py-1.5 text-muted-foreground transition hover:bg-primary/5 hover:text-foreground"
          >
            Select all
          </button>
          <span className="h-4 w-px bg-border/50" />
          <button
            type="button"
            onClick={clearAll}
            className="px-3 py-1.5 text-muted-foreground transition hover:bg-primary/5 hover:text-foreground"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const color = getColor(item, colorMap);
          const active = !hasNone && (activeItems.size === 0 || activeItems.has(item));
          const chipSurface = withAlpha(color, active ? 'F2' : '18');
          const chipBorder = withAlpha(color, active ? '70' : '42');
          const chipGlow = withAlpha(color, '30');
          const chipText = active ? '#FFFFFF' : color;

          return (
            <div
              key={item}
              className={cn(
                'group relative rounded-full border transition'
              )}
              style={{
                background: active
                  ? `linear-gradient(180deg, ${withAlpha(color, 'FF')}, ${withAlpha(color, 'E8')})`
                  : `linear-gradient(180deg, ${chipSurface}, rgba(255,255,255,0.96))`,
                borderColor: chipBorder,
                boxShadow: active ? `inset 0 0 0 1px ${withAlpha('#111827', '10')}` : `inset 0 0 0 1px ${withAlpha(color, '12')}`,
              }}
            >
              <button
                type="button"
                onClick={() => toggleItem(item)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold transition'
                )}
                style={{ color: chipText }}
              >
                <span
                  className={cn(
                    'h-2.5 w-2.5 rounded-full border shadow-sm',
                    active ? 'border-white/70 bg-white/85' : 'border-white/50'
                  )}
                  style={!active ? { backgroundColor: color } : undefined}
                />
                <span>{item}</span>
              </button>
              <input
                type="color"
                value={toHex(color)}
                onChange={(event) =>
                  setColorMap?.((current) => ({
                    ...(current || {}),
                    [item]: event.target.value,
                  }))
                }
                className="mx-1 my-1 h-6 w-6 cursor-pointer rounded-full border border-white/40 bg-transparent p-0"
                title={`Set ${item} color`}
                aria-label={`Set ${item} color`}
              />
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground">
        {allSelected
          ? 'All items are active.'
          : `${activeCount} of ${items.length} active.`}
      </p>
    </div>
  );
}
