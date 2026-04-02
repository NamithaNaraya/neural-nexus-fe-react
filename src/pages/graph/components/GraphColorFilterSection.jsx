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
  getColor,
}) {
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
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </div>
        <div className="flex items-center gap-2 text-[10px] font-medium">
          <button
            type="button"
            onClick={selectAll}
            className="rounded-full border border-border/30 bg-background/30 px-2.5 py-1 text-muted-foreground transition hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-full border border-border/30 bg-background/30 px-2.5 py-1 text-muted-foreground transition hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
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
