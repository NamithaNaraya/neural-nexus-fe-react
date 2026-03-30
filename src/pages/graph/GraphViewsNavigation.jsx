import React from 'react';
import { NavLink } from 'react-router-dom';
export function GraphViewsNavigation({ sections, basePath = '/graph' }) {
  return (
    <div className="space-y-4">
      {sections.map((group) => (
        <div key={group.label} className="space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">{group.label}</div>
          <div className="flex flex-wrap gap-2">
            {group.items.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={`${basePath}/${path}`}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg border text-sm font-medium ${isActive ? 'bg-primary text-white border-primary' : 'bg-muted/10 text-muted-foreground border-border hover:bg-muted/20'}`
                }
              >
                <Icon className="w-4 h-4 mr-1 inline" /> {label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
