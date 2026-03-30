import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { PieChart } from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import { cn } from '../../utils/cn';

/**
 * Node Type Distribution Card - Interactive Sunburst View
 * Shows the composition of your knowledge graph by entity type
 * Updates dynamically from the actual Neo4j database
 */
export function NodeTypeDistributionCard({ folderId = null }) {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalNodes, setTotalNodes] = useState(0);
  const [hoveredType, setHoveredType] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await dashboardService.getNodeTypeDistribution(folderId);
        setTypes(data);
        const total = data.reduce((sum, t) => sum + t.count, 0);
        setTotalNodes(total);
      } catch (err) {
        console.error(err);
        setError('Failed to load node types');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [folderId]);

  if (loading) {
    return (
      <Card className="hover:border-primary/10 transition-all duration-500 ease-out col-span-full lg:col-span-1">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChart className="w-4 h-4 text-primary" />
            Node Type Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || types.length === 0) {
    return (
      <Card className="hover:border-primary/10 transition-all duration-500 ease-out col-span-full lg:col-span-1">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChart className="w-4 h-4 text-primary" />
            Node Type Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground text-sm">
            <PieChart className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>{error || 'No node types found'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Vibrant color palette for interactive pie chart
  const vibrantColors = [
    '#3b82f6', // blue-500
    '#8b5cf6', // purple-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#f43f5e', // rose-500
    '#6366f1', // indigo-500
    '#14b8a6', // teal-500
    '#d946ef', // fuchsia-500
    '#84cc16', // lime-500
    '#0ea5e9', // sky-500
  ];

  const svgData = types.map((type, idx) => ({
    type: type.type,
    count: type.count,
    percentage: totalNodes > 0 ? (type.count / totalNodes) * 100 : 0,
    color: vibrantColors[idx % vibrantColors.length],
  }));

  // Create SVG pie chart
  let currentAngle = -Math.PI / 2;
  const slices = svgData.map((item) => {
    const sliceAngle = (item.percentage / 100) * Math.PI * 2;
    const radius = 80;
    const startX = 100 + radius * Math.cos(currentAngle);
    const startY = 100 + radius * Math.sin(currentAngle);
    
    const endAngle = currentAngle + sliceAngle;
    const endX = 100 + radius * Math.cos(endAngle);
    const endY = 100 + radius * Math.sin(endAngle);

    const largeArc = sliceAngle > Math.PI ? 1 : 0;
    const path = `M 100 100 L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;

    const midAngle = currentAngle + sliceAngle / 2;
    const labelRadius = 110;
    const labelX = 100 + labelRadius * Math.cos(midAngle);
    const labelY = 100 + labelRadius * Math.sin(midAngle);

    currentAngle = endAngle;

    return { item, path, labelX, labelY };
  });

  return (
    <Card className="hover:border-primary/10 transition-all duration-500 ease-out col-span-full lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PieChart className="w-5 h-5 text-primary" />
          Knowledge Graph Composition
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          <span className="font-bold text-lg text-primary">{totalNodes.toLocaleString()}</span> total entities across <span className="font-bold">{types.length}</span> types
        </p>
      </CardHeader>
      <CardContent className="p-0 flex flex-col md:flex-row gap-0">
        {/* Large SVG Pie Chart - Takes up more space */}
        <div className="w-full md:w-2/3 flex justify-center items-center p-6 md:p-8 bg-gradient-to-br from-background/30 via-background/20 to-background/10">
          <svg width="400" height="400" viewBox="0 0 200 200" className="drop-shadow-2xl" style={{ maxWidth: '100%', height: 'auto' }}>
            {slices.map((slice, idx) => (
              <g
                key={slice.item.type}
                onMouseEnter={() => setHoveredType(slice.item.type)}
                onMouseLeave={() => setHoveredType(null)}
                className="cursor-pointer transition-opacity duration-200"
                style={{
                  opacity: hoveredType === null || hoveredType === slice.item.type ? 1 : 0.3,
                }}
              >
                {/* Pie slice */}
                <path
                  d={slice.path}
                  fill={slice.item.color}
                  className="transition-all duration-200 hover:filter hover:brightness-125"
                  style={{
                    filter: hoveredType === slice.item.type ? 'drop-shadow(0 0 12px rgba(0,0,0,0.4))' : 'none',
                  }}
                />
                
                {/* Percentage label - larger */}
                {slice.item.percentage > 5 && (
                  <text
                    x={slice.labelX}
                    y={slice.labelY}
                    textAnchor="middle"
                    dy="0.3em"
                    className="text-sm font-bold fill-white drop-shadow-md pointer-events-none"
                    style={{ fontSize: '13px', fontWeight: '800' }}
                  >
                    {slice.item.percentage.toFixed(0)}%
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>

        {/* Legend with details - Right side */}
        <div className="w-full md:w-1/3 p-6 border-t md:border-t-0 md:border-l border-border/20 overflow-y-auto max-h-96">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Entity Types</h3>
          <div className="space-y-2.5">
            {svgData.map((item, idx) => (
              <div
                key={item.type}
                onMouseEnter={() => setHoveredType(item.type)}
                onMouseLeave={() => setHoveredType(null)}
                className={cn(
                  'p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer transform',
                  hoveredType === item.type
                    ? 'scale-105 shadow-lg'
                    : 'border-border/20 hover:border-border/40 hover:scale-102'
                )}
                style={{
                  borderColor: hoveredType === item.type ? item.color : 'var(--border)',
                  backgroundColor: hoveredType === item.type ? `${item.color}15` : 'transparent',
                }}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className="w-5 h-5 rounded-full shadow-md transition-transform hover:scale-125"
                    style={{ backgroundColor: item.color }}
                  />
                  <p className="text-sm font-bold truncate flex-1">{item.type}</p>
                </div>
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-muted-foreground font-medium">{item.count.toLocaleString()} nodes</span>
                  <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ 
                    color: item.color,
                    backgroundColor: `${item.color}20`
                  }}>
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
