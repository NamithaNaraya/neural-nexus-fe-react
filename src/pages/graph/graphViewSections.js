import { BarChart3, Box, Compass, Grid2x2, Layers, TableProperties, Waypoints } from 'lucide-react';

export const knowledgeGraphSections = [
  {
    label: 'Knowledge Graph',
    items: [
      { path: '2d', label: '2D Graph', icon: Compass },
      // { path: '2d-hybrid', label: 'Hybrid 2D', icon: Blend },
      // { path: 'd3-force', label: 'D3 Force', icon: Orbit },
      // { path: '2d-echarts', label: '2D ECharts', icon: Grid2x2 },
      // { path: 'nvl', label: 'NVL Graph', icon: Network },
      { path: '3d', label: '3D Graph', icon: Box },
      { path: 'table', label: 'Table', icon: TableProperties },
    ],
  },
];

export const visualizeDataSections = [
  {
    label: 'Visualize Data',
    items: [
      { path: 'sunburst', label: 'Sunburst', icon: Layers },
      { path: 'treemap', label: 'Treemap', icon: Grid2x2 },
      { path: 'schema', label: 'Schema', icon: Waypoints },
      { path: 'degree', label: 'Degree', icon: BarChart3 },
      { path: 'matrix', label: 'Matrix', icon: Grid2x2 },
    ],
  },
];
