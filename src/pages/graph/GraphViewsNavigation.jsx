import React from 'react';
import { NavLink } from 'react-router-dom';
import { Gauge, Compass, Layers } from 'lucide-react';

const viewItems = [
  { path: 'overview', label: 'Overview', icon: Gauge },
  { path: 'force', label: 'Force Graph', icon: Compass },
  { path: 'sunburst', label: 'Sunburst', icon: Layers },
];

export function GraphViewsNavigation() {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {viewItems.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={`/graph/${path}`}
          className={({ isActive }) =>
            `px-4 py-2 rounded-lg border text-sm font-medium ${isActive ? 'bg-primary text-white border-primary' : 'bg-muted/10 text-muted-foreground border-border hover:bg-muted/20'}`
          }
        >
          <Icon className="w-4 h-4 mr-1 inline" /> {label}
        </NavLink>
      ))}
    </div>
  );
}
