import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, BookOpenText, Box, Compass, Grid2x2, Layers, TableProperties, Waypoints } from 'lucide-react';

const viewItems = [
  { path: 'overview', label: 'Overview', icon: BookOpenText },
  { path: '2d', label: '2D Graph', icon: Compass },
  { path: '3d', label: '3D Graph', icon: Box },
  { path: 'sunburst', label: 'Sunburst', icon: Layers },
  { path: 'treemap', label: 'Treemap', icon: Grid2x2 },
  { path: 'schema', label: 'Schema', icon: Waypoints },
  { path: 'degree', label: 'Degree', icon: BarChart3 },
  { path: 'matrix', label: 'Matrix', icon: Grid2x2 },
  { path: 'table', label: 'Table', icon: TableProperties },
];

export function GraphViewsNavigation() {
  return (
    <div className="flex flex-wrap gap-2">
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
